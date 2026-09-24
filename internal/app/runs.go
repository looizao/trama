package app

import (
	"net/http"
	"strings"
	"time"

	"go.temporal.io/sdk/client"
)

const TaskQueue = "trama-images"

type Run struct {
	ID            string    `json:"id"`
	CaseID        string    `json:"caseId"`
	SourceAssetID string    `json:"sourceAssetId"`
	Prompt        string    `json:"prompt"`
	ModelID       string    `json:"modelId"`
	Quantity      int       `json:"quantity"`
	Status        string    `json:"status"`
	Error         string    `json:"error"`
	CreatedAt     time.Time `json:"createdAt"`
}

func (a *App) listRuns(w http.ResponseWriter, r *http.Request) {
	caseID := r.PathValue("caseID")
	if !a.caseExists(r, caseID) {
		problem(w, 404, "case not found")
		return
	}
	rows, err := a.DB.Query(r.Context(), "SELECT id,case_id,COALESCE(source_asset_id::text,''),prompt,model_id,quantity,status,error,created_at FROM generation_runs WHERE case_id=$1 AND organization_id=$2 ORDER BY created_at DESC LIMIT 100", caseID, userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load runs")
		return
	}
	defer rows.Close()
	items := []Run{}
	for rows.Next() {
		var x Run
		if err = rows.Scan(&x.ID, &x.CaseID, &x.SourceAssetID, &x.Prompt, &x.ModelID, &x.Quantity, &x.Status, &x.Error, &x.CreatedAt); err != nil {
			problem(w, 500, "could not load runs")
			return
		}
		items = append(items, x)
	}
	respond(w, 200, items)
}

func (a *App) getRun(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("runID")
	if !isID(id) {
		problem(w, 404, "run not found")
		return
	}
	var x Run
	err := a.DB.QueryRow(r.Context(), "SELECT id,case_id,COALESCE(source_asset_id::text,''),prompt,model_id,quantity,status,error,created_at FROM generation_runs WHERE id=$1 AND organization_id=$2", id, userFrom(r).OrganizationID).Scan(&x.ID, &x.CaseID, &x.SourceAssetID, &x.Prompt, &x.ModelID, &x.Quantity, &x.Status, &x.Error, &x.CreatedAt)
	if err != nil {
		problem(w, 404, "run not found")
		return
	}
	respond(w, 200, x)
}

func (a *App) createRun(w http.ResponseWriter, r *http.Request) {
	caseID := r.PathValue("caseID")
	if !a.caseExists(r, caseID) {
		problem(w, 404, "case not found")
		return
	}
	if !a.modelReady() {
		problem(w, 503, "image generation is not configured yet")
		return
	}
	var in struct {
		SourceAssetID string `json:"sourceAssetId"`
		Prompt        string `json:"prompt"`
		Quantity      int    `json:"quantity"`
		ModelID       string `json:"modelId"`
	}
	if err := decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Prompt = strings.TrimSpace(in.Prompt)
	if len(in.Prompt) < 10 || len(in.Prompt) > 1500 || in.Quantity < 1 || in.Quantity > 4 {
		problem(w, 400, "provide a description of 10 to 1500 characters and 1 to 4 images")
		return
	}
	if in.ModelID == "" {
		in.ModelID = "fal-ai/flux-pro/kontext"
	}
	if in.ModelID != "fal-ai/flux-pro/kontext" {
		problem(w, 400, "unsupported model")
		return
	}
	if !isID(in.SourceAssetID) {
		problem(w, 400, "select a source image")
		return
	}
	var found string
	err := a.DB.QueryRow(r.Context(), "SELECT id FROM assets WHERE id=$1 AND case_id=$2 AND organization_id=$3", in.SourceAssetID, caseID, userFrom(r).OrganizationID).Scan(&found)
	if err != nil {
		problem(w, 404, "source image not found")
		return
	}
	u := userFrom(r)
	x := Run{ID: newID(), CaseID: caseID, SourceAssetID: in.SourceAssetID, Prompt: in.Prompt, ModelID: in.ModelID, Quantity: in.Quantity, Status: "queued", CreatedAt: now()}
	_, err = a.DB.Exec(r.Context(), "INSERT INTO generation_runs(id,organization_id,case_id,source_asset_id,prompt,model_id,quantity,status,created_by,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", x.ID, u.OrganizationID, caseID, x.SourceAssetID, x.Prompt, x.ModelID, x.Quantity, x.Status, u.ID, x.CreatedAt)
	if err != nil {
		problem(w, 500, "could not create run")
		return
	}
	_, err = a.Temporal.ExecuteWorkflow(r.Context(), client.StartWorkflowOptions{ID: x.ID, TaskQueue: TaskQueue}, GenerateWorkflow, x.ID)
	if err != nil {
		_, _ = a.DB.Exec(r.Context(), "UPDATE generation_runs SET status='failed',error=$1 WHERE id=$2", err.Error(), x.ID)
		problem(w, 503, "could not start image workflow")
		return
	}
	a.audit(r, "generate", "run", x.ID)
	respond(w, 202, x)
}
