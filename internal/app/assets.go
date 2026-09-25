package app

import (
	"bytes"
	"io"
	"net/http"
	"strings"
	"time"
)

type Asset struct {
	ID            string    `json:"id"`
	ClientID      string    `json:"clientId"`
	RunID         string    `json:"runId"`
	MilestoneID   string    `json:"milestoneId"`
	SourceAssetID string    `json:"sourceAssetId"`
	Kind          string    `json:"kind"`
	ContentType   string    `json:"contentType"`
	CreatedAt     time.Time `json:"createdAt"`
}

func (a *App) listAssets(w http.ResponseWriter, r *http.Request) {
	clientID := r.PathValue("clientID")
	if !a.clientExists(r, clientID) {
		problem(w, 404, "client not found")
		return
	}
	rows, err := a.DB.Query(r.Context(), `SELECT id,client_id,COALESCE(run_id::text,''),COALESCE(milestone_id::text,''),COALESCE(source_asset_id::text,''),kind,content_type,created_at FROM assets WHERE client_id=$1 AND organization_id=$2 ORDER BY created_at DESC`, clientID, userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load assets")
		return
	}
	defer rows.Close()
	items := []Asset{}
	for rows.Next() {
		var x Asset
		if err = rows.Scan(&x.ID, &x.ClientID, &x.RunID, &x.MilestoneID, &x.SourceAssetID, &x.Kind, &x.ContentType, &x.CreatedAt); err != nil {
			problem(w, 500, "could not load assets")
			return
		}
		items = append(items, x)
	}
	respond(w, 200, items)
}

func (a *App) uploadAsset(w http.ResponseWriter, r *http.Request) {
	clientID := r.PathValue("clientID")
	if !a.clientExists(r, clientID) {
		problem(w, 404, "client not found")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 12<<20)
	if err := r.ParseMultipartForm(12 << 20); err != nil {
		problem(w, 400, "image is too large or invalid")
		return
	}
	f, _, err := r.FormFile("image")
	if err != nil {
		problem(w, 400, "image is required")
		return
	}
	defer f.Close()
	data, err := io.ReadAll(io.LimitReader(f, (10<<20)+1))
	if err != nil {
		problem(w, 400, "could not read image")
		return
	}
	if len(data) == 0 || len(data) > 10<<20 {
		problem(w, 400, "image must be at most 10 MB")
		return
	}
	contentType := http.DetectContentType(data)
	ext := ""
	switch contentType {
	case "image/jpeg":
		ext = "jpg"
	case "image/png":
		ext = "png"
	case "image/webp":
		ext = "webp"
	}
	if ext == "" {
		problem(w, 400, "use a JPEG, PNG, or WebP image")
		return
	}
	u := userFrom(r)
	id := newID()
	key := u.OrganizationID + "/" + clientID + "/" + id + "." + ext
	if err = a.Storage.Put(r.Context(), key, contentType, bytes.NewReader(data)); err != nil {
		problem(w, 500, "could not store image")
		return
	}
	created := now()
	_, err = a.DB.Exec(r.Context(), "INSERT INTO assets(id,organization_id,client_id,storage_key,content_type,kind,created_at) VALUES($1,$2,$3,$4,$5,'source',$6)", id, u.OrganizationID, clientID, key, contentType, created)
	if err != nil {
		problem(w, 500, "could not save image record")
		return
	}
	a.audit(r, "upload", "asset", id)
	respond(w, 201, Asset{ID: id, ClientID: clientID, Kind: "source", ContentType: contentType, CreatedAt: created})
}

func (a *App) assetContent(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("assetID")
	if !isID(id) {
		problem(w, 404, "image not found")
		return
	}
	var key, contentType string
	err := a.DB.QueryRow(r.Context(), "SELECT storage_key,content_type FROM assets WHERE id=$1 AND organization_id=$2", id, userFrom(r).OrganizationID).Scan(&key, &contentType)
	if err != nil {
		problem(w, 404, "image not found")
		return
	}
	body, err := a.Storage.Get(r.Context(), key)
	if err != nil {
		problem(w, 500, "could not load image")
		return
	}
	defer body.Close()
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "private, max-age=120")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	_, _ = io.Copy(w, body)
}

func (a *App) modelAssetContent(w http.ResponseWriter, r *http.Request) {
	key, err := a.Storage.VerifyModelToken(r.PathValue("token"))
	if err != nil {
		problem(w, 403, "image link expired")
		return
	}
	body, err := a.Storage.Get(r.Context(), key)
	if err != nil {
		problem(w, 404, "image not found")
		return
	}
	defer body.Close()
	data, err := io.ReadAll(io.LimitReader(body, (20<<20)+1))
	if err != nil || len(data) > 20<<20 {
		problem(w, 500, "could not read image")
		return
	}
	w.Header().Set("Content-Type", http.DetectContentType(data))
	w.Header().Set("Cache-Control", "private, no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	_, _ = w.Write(data)
}

func (a *App) placeAsset(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("assetID")
	if !isID(id) {
		problem(w, 404, "image not found")
		return
	}
	var clientID string
	err := a.DB.QueryRow(r.Context(), "SELECT client_id FROM assets WHERE id=$1 AND organization_id=$2", id, userFrom(r).OrganizationID).Scan(&clientID)
	if err != nil {
		problem(w, 404, "image not found")
		return
	}
	var in struct {
		MilestoneID string `json:"milestoneId"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.MilestoneID = strings.TrimSpace(in.MilestoneID)
	if in.MilestoneID == "" {
		_, err = a.DB.Exec(r.Context(), "UPDATE assets SET milestone_id=NULL WHERE id=$1 AND organization_id=$2", id, userFrom(r).OrganizationID)
	} else {
		if !isID(in.MilestoneID) {
			problem(w, 400, "invalid milestone")
			return
		}
		var found string
		if err = a.DB.QueryRow(r.Context(), "SELECT id FROM milestones WHERE id=$1 AND client_id=$2 AND organization_id=$3", in.MilestoneID, clientID, userFrom(r).OrganizationID).Scan(&found); err != nil {
			problem(w, 404, "milestone not found")
			return
		}
		_, err = a.DB.Exec(r.Context(), "UPDATE assets SET milestone_id=$1 WHERE id=$2 AND organization_id=$3", in.MilestoneID, id, userFrom(r).OrganizationID)
	}
	if err != nil {
		problem(w, 500, "could not update image")
		return
	}
	a.audit(r, "place", "asset", id)
	respond(w, 200, map[string]string{"status": "ok"})
}
