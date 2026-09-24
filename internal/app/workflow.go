package app

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"path"
	"strconv"
	"strings"
	"time"

	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)

func GenerateWorkflow(ctx workflow.Context, runID string) error {
	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 20 * time.Minute,
		RetryPolicy: &temporal.RetryPolicy{
			InitialInterval: 3 * time.Second, BackoffCoefficient: 2,
			MaximumInterval: time.Minute, MaximumAttempts: 3,
		},
	})
	if err := workflow.ExecuteActivity(ctx, "GenerateImages", runID).Get(ctx, nil); err != nil {
		_ = workflow.ExecuteActivity(ctx, "FailRun", runID, err.Error()).Get(ctx, nil)
		return err
	}
	return nil
}

func (a *App) FailRun(ctx context.Context, runID, reason string) error {
	if len(reason) > 1000 {
		reason = reason[:1000]
	}
	_, err := a.DB.Exec(ctx, "UPDATE generation_runs SET status='failed',error=$1,completed_at=now() WHERE id=$2 AND status!='completed'", reason, runID)
	return err
}

type imageEditResponse struct {
	Data []struct {
		Base64 string `json:"b64_json"`
	} `json:"data"`
}

// editImages uses the OpenAI Images API edit shape. The proxy must accept an
// idempotency key so an activity retry cannot charge for a second generation.
func (a *App) editImages(ctx context.Context, runID, sourceKey, contentType, prompt string, quantity int) ([][]byte, error) {
	base, err := url.Parse(a.ImageAPIBaseURL)
	if err != nil || base.Host == "" || base.User != nil || (base.Scheme != "https" && !(base.Scheme == "http" && (base.Hostname() == "localhost" || base.Hostname() == "127.0.0.1"))) {
		return nil, errors.New("IMAGE_API_BASE_URL must be HTTPS")
	}
	endpoint := strings.TrimSuffix(base.String(), "/") + "/images/edits"
	source, err := a.Storage.Get(ctx, sourceKey)
	if err != nil {
		return nil, err
	}
	defer source.Close()
	var body bytes.Buffer
	form := multipart.NewWriter(&body)
	file, err := form.CreateFormFile("image", "portrait"+imageExt(contentType))
	if err != nil {
		return nil, err
	}
	if _, err = io.Copy(file, io.LimitReader(source, (10<<20)+1)); err != nil {
		return nil, err
	}
	for name, value := range map[string]string{
		"model": a.ImageModel, "prompt": prompt,
		"n": strconv.Itoa(quantity), "output_format": "jpeg",
	} {
		if err = form.WriteField(name, value); err != nil {
			return nil, err
		}
	}
	if err = form.Close(); err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, &body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+a.ImageAPIKey)
	req.Header.Set("Content-Type", form.FormDataContentType())
	req.Header.Set("Idempotency-Key", runID)
	resp, err := (&http.Client{Timeout: 18 * time.Minute}).Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		message, _ := io.ReadAll(io.LimitReader(resp.Body, 500))
		return nil, fmt.Errorf("image proxy returned %d: %s", resp.StatusCode, string(message))
	}
	var result imageEditResponse
	if err = json.NewDecoder(io.LimitReader(resp.Body, 120<<20)).Decode(&result); err != nil {
		return nil, err
	}
	if len(result.Data) != quantity {
		return nil, fmt.Errorf("image proxy returned %d images, expected %d", len(result.Data), quantity)
	}
	images := make([][]byte, 0, quantity)
	for _, item := range result.Data {
		if len(item.Base64) == 0 || len(item.Base64) > 28<<20 {
			return nil, errors.New("image proxy returned an empty or oversized image")
		}
		data, err := base64.StdEncoding.DecodeString(item.Base64)
		if err != nil {
			return nil, err
		}
		if _, err = imageType(data); err != nil {
			return nil, err
		}
		images = append(images, data)
	}
	return images, nil
}

func imageType(data []byte) (string, error) {
	if len(data) == 0 || len(data) > 20<<20 {
		return "", errors.New("generated image is empty or too large")
	}
	contentType := http.DetectContentType(data)
	switch contentType {
	case "image/jpeg", "image/png", "image/webp":
		return contentType, nil
	default:
		return "", errors.New("image proxy returned a non-image file")
	}
}

func imageExt(contentType string) string {
	switch contentType {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	default:
		return ""
	}
}

func (a *App) GenerateImages(ctx context.Context, runID string) error {
	if a.ImageAPIBaseURL == "" || a.ImageAPIKey == "" || a.ImageModel == "" {
		return errors.New("image proxy is not configured")
	}
	var orgID, caseID, sourceID, prompt, modelID, sourceKey, sourceContentType string
	var quantity int
	err := a.DB.QueryRow(ctx, `SELECT r.organization_id,r.case_id,r.source_asset_id,r.prompt,r.model_id,a.storage_key,a.content_type,r.quantity FROM generation_runs r JOIN assets a ON a.id=r.source_asset_id AND a.organization_id=r.organization_id WHERE r.id=$1`, runID).Scan(&orgID, &caseID, &sourceID, &prompt, &modelID, &sourceKey, &sourceContentType, &quantity)
	if err != nil {
		return err
	}
	if modelID != a.ImageModel {
		return errors.New("configured image model does not match run")
	}
	if _, err = a.DB.Exec(ctx, "UPDATE generation_runs SET status='running' WHERE id=$1 AND status IN ('queued','running')", runID); err != nil {
		return err
	}
	images, err := a.editImages(ctx, runID, sourceKey, sourceContentType, prompt, quantity)
	if err != nil {
		return err
	}
	for i, data := range images {
		if err = a.storeGeneratedImage(ctx, orgID, caseID, runID, sourceID, i, data); err != nil {
			return err
		}
	}
	_, err = a.DB.Exec(ctx, "UPDATE generation_runs SET status='completed',completed_at=now(),error='' WHERE id=$1", runID)
	return err
}

func (a *App) storeGeneratedImage(ctx context.Context, orgID, caseID, runID, sourceID string, index int, data []byte) error {
	var exists bool
	if err := a.DB.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM assets WHERE run_id=$1 AND variant_index=$2)", runID, index).Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	contentType, err := imageType(data)
	if err != nil {
		return err
	}
	id := newID()
	key := path.Join(orgID, caseID, id+imageExt(contentType))
	if err = a.Storage.Put(ctx, key, contentType, bytes.NewReader(data)); err != nil {
		return err
	}
	_, err = a.DB.Exec(ctx, "INSERT INTO assets(id,organization_id,case_id,run_id,source_asset_id,storage_key,content_type,kind,variant_index) VALUES($1,$2,$3,$4,$5,$6,$7,'generated',$8) ON CONFLICT DO NOTHING", id, orgID, caseID, runID, sourceID, key, contentType, index)
	return err
}
