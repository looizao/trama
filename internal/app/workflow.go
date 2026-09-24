package app

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"go.temporal.io/sdk/activity"
	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

func GenerateWorkflow(ctx workflow.Context, runID string) error {
	ctx=workflow.WithActivityOptions(ctx,workflow.ActivityOptions{
		StartToCloseTimeout:20*time.Minute,
		HeartbeatTimeout:time.Minute,
		RetryPolicy:&temporal.RetryPolicy{InitialInterval:time.Second*3,BackoffCoefficient:2,MaximumInterval:time.Minute,MaximumAttempts:3},
	})
	if err:=workflow.ExecuteActivity(ctx,"GenerateImages",runID).Get(ctx,nil); err!=nil {
		_ = workflow.ExecuteActivity(ctx,"FailRun",runID,err.Error()).Get(ctx,nil)
		return err
	}
	return nil
}

func (a *App) FailRun(ctx context.Context, runID, reason string) error {
	if len(reason)>1000 { reason=reason[:1000] }
	_,err:=a.DB.Exec(ctx,"UPDATE generation_runs SET status='failed',error=$1,completed_at=now() WHERE id=$2 AND status!='completed'",reason,runID)
	return err
}

type falSubmit struct { RequestID string `json:"request_id"` }
type falStatus struct { Status string `json:"status"`; Error string `json:"error"` }
type falResult struct { Images []struct { URL string `json:"url"` } `json:"images"` }

func falRequest(ctx context.Context, method, endpoint, key string, body any, target any) error {
	var reader io.Reader
	if body!=nil { data,err:=json.Marshal(body); if err!=nil { return err }; reader=bytes.NewReader(data) }
	req,err:=http.NewRequestWithContext(ctx,method,endpoint,reader)
	if err!=nil { return err }
	req.Header.Set("Authorization","Key "+key)
	if body!=nil { req.Header.Set("Content-Type","application/json") }
	client:=http.Client{Timeout:30*time.Second}
	resp,err:=client.Do(req); if err!=nil { return err }; defer resp.Body.Close()
	if resp.StatusCode<200 || resp.StatusCode>=300 {
		text,_:=io.ReadAll(io.LimitReader(resp.Body,500))
		return fmt.Errorf("model API returned %d: %s",resp.StatusCode,string(text))
	}
	return json.NewDecoder(io.LimitReader(resp.Body,1<<20)).Decode(target)
}

func (a *App) GenerateImages(ctx context.Context, runID string) error {
	if a.FalKey=="" || a.Storage.mode!="s3" { return errors.New("model or storage is not configured") }
	var orgID,caseID,sourceID,prompt,modelID,providerID,sourceKey string
	var quantity int
	err:=a.DB.QueryRow(ctx,`SELECT r.organization_id,r.case_id,r.source_asset_id,r.prompt,r.model_id,r.provider_request_id,a.storage_key,r.quantity FROM generation_runs r JOIN assets a ON a.id=r.source_asset_id AND a.organization_id=r.organization_id WHERE r.id=$1`,runID).Scan(&orgID,&caseID,&sourceID,&prompt,&modelID,&providerID,&sourceKey,&quantity)
	if err!=nil { return err }
	if modelID!="fal-ai/flux-pro/kontext" { return errors.New("unsupported model") }
	_,err=a.DB.Exec(ctx,"UPDATE generation_runs SET status='running' WHERE id=$1 AND status IN ('queued','running')",runID)
	if err!=nil { return err }
	base:="https://queue.fal.run/"+modelID
	if providerID=="" {
		sourceURL,err:=a.Storage.PresignGet(ctx,sourceKey,2*time.Hour)
		if err!=nil { return err }
		var submitted falSubmit
		err=falRequest(ctx,"POST",base,a.FalKey,map[string]any{"prompt":prompt,"image_url":sourceURL,"num_images":quantity,"output_format":"jpeg"},&submitted)
		if err!=nil { return err }
		if submitted.RequestID=="" { return errors.New("model API did not return a request ID") }
		providerID=submitted.RequestID
		if _,err=a.DB.Exec(ctx,"UPDATE generation_runs SET provider_request_id=$1 WHERE id=$2",providerID,runID); err!=nil { return err }
	}
	requestURL:=base+"/requests/"+url.PathEscape(providerID)
	deadline:=time.Now().Add(15*time.Minute)
	for {
		if time.Now().After(deadline) { return errors.New("model generation timed out") }
		var status falStatus
		if err=falRequest(ctx,"GET",requestURL+"/status",a.FalKey,nil,&status); err!=nil { return err }
		activity.RecordHeartbeat(ctx,status.Status)
		if status.Status=="COMPLETED" { if status.Error!="" { return errors.New(status.Error) }; break }
		if status.Status!="IN_QUEUE" && status.Status!="IN_PROGRESS" { return fmt.Errorf("unexpected model status: %s",status.Status) }
		select { case <-ctx.Done(): return ctx.Err(); case <-time.After(3*time.Second): }
	}
	var result falResult
	if err=falRequest(ctx,"GET",requestURL,a.FalKey,nil,&result); err!=nil { return err }
	if len(result.Images)==0 { return errors.New("model returned no images") }
	for i, image:=range result.Images {
		if err=saveGeneratedImage(ctx,a,orgID,caseID,runID,sourceID,i,image.URL); err!=nil { return err }
		activity.RecordHeartbeat(ctx,fmt.Sprintf("stored %d of %d",i+1,len(result.Images)))
	}
	_,err=a.DB.Exec(ctx,"UPDATE generation_runs SET status='completed',completed_at=now(),error='' WHERE id=$1",runID)
	return err
}

func saveGeneratedImage(ctx context.Context,a *App,orgID,caseID,runID,sourceID string,index int,imageURL string) error {
	var exists bool
	if err:=a.DB.QueryRow(ctx,"SELECT EXISTS(SELECT 1 FROM assets WHERE run_id=$1 AND variant_index=$2)",runID,index).Scan(&exists); err!=nil { return err }
	if exists { return nil }
	parsed,err:=url.Parse(imageURL)
	if err!=nil || parsed.Scheme!="https" || !(parsed.Hostname()=="fal.media" || strings.HasSuffix(parsed.Hostname(),".fal.media")) { return errors.New("model returned an unexpected image URL") }
	req,err:=http.NewRequestWithContext(ctx,"GET",imageURL,nil); if err!=nil { return err }
	client:=http.Client{Timeout:2*time.Minute}
	resp,err:=client.Do(req); if err!=nil { return err }; defer resp.Body.Close()
	if resp.StatusCode!=200 { return fmt.Errorf("model image download returned %d",resp.StatusCode) }
	data,err:=io.ReadAll(io.LimitReader(resp.Body,(20<<20)+1)); if err!=nil { return err }
	if len(data)>20<<20 { return errors.New("generated image is too large") }
	contentType:=http.DetectContentType(data)
	ext:=""; switch contentType { case "image/jpeg": ext="jpg"; case "image/png": ext="png"; case "image/webp": ext="webp"; default: return errors.New("model returned a non-image file") }
	id:=newID(); key:=orgID+"/"+caseID+"/"+id+"."+ext
	if err=a.Storage.Put(ctx,key,contentType,bytes.NewReader(data)); err!=nil { return err }
	_,err=a.DB.Exec(ctx,"INSERT INTO assets(id,organization_id,case_id,run_id,source_asset_id,storage_key,content_type,kind,variant_index) VALUES($1,$2,$3,$4,$5,$6,$7,'generated',$8) ON CONFLICT DO NOTHING",id,orgID,caseID,runID,sourceID,key,contentType,index)
	return err
}
