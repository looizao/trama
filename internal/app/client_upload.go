package app

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

type uploadLinkKey struct{}

type ClientUploadLink struct {
	ID             string          `json:"id"`
	Title          string          `json:"title"`
	PhotoSetID     string          `json:"photoSetId"`
	ConsultationID string          `json:"consultationId"`
	ExpiresAt      time.Time       `json:"expiresAt"`
	RevokedAt      *time.Time      `json:"revokedAt"`
	SubmittedAt    *time.Time      `json:"submittedAt"`
	ReviewedAt     *time.Time      `json:"reviewedAt"`
	CreatedAt      time.Time       `json:"createdAt"`
	Template       *IntakeTemplate `json:"template"`
}

const uploadLinkColumns = "id,title,photo_set_id,COALESCE(consultation_id,''),expires_at,revoked_at,submitted_at,reviewed_at,created_at,template_snapshot"

func scanUploadLink(row interface{ Scan(...any) error }) (ClientUploadLink, error) {
	var x ClientUploadLink
	var raw string
	err := row.Scan(&x.ID, &x.Title, &x.PhotoSetID, &x.ConsultationID, &x.ExpiresAt, &x.RevokedAt, &x.SubmittedAt, &x.ReviewedAt, &x.CreatedAt, &raw)
	if err == nil {
		err = json.Unmarshal([]byte(raw), &x.Template)
	}
	return x, err
}
func (a *App) listClientUploadLinks(w http.ResponseWriter, r *http.Request) {
	if !a.clientExists(r, r.PathValue("clientID")) {
		problem(w, 404, "client not found")
		return
	}
	rows, err := a.DB.QueryContext(r.Context(), "SELECT "+uploadLinkColumns+" FROM client_upload_links WHERE client_id=$1 AND organization_id=$2 ORDER BY created_at DESC", r.PathValue("clientID"), userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load client links")
		return
	}
	defer rows.Close()
	items := []ClientUploadLink{}
	for rows.Next() {
		x, e := scanUploadLink(rows)
		if e != nil {
			problem(w, 500, "could not load client links")
			return
		}
		items = append(items, x)
	}
	if rows.Err() != nil {
		problem(w, 500, "could not load client links")
		return
	}
	respond(w, 200, items)
}
func (a *App) createClientUploadLink(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	if !a.authorizeDemoClient(w, r) {
		return
	}
	var in struct {
		Title           string `json:"title"`
		Hours           int    `json:"hours"`
		TemplateID      string `json:"templateId"`
		TemplateVersion int    `json:"templateVersion"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Title = strings.TrimSpace(in.Title)
	if in.Hours == 0 {
		in.Hours = 24
	}
	if len(in.Title) < 2 || len(in.Title) > 160 || in.Hours < 1 || in.Hours > 168 {
		problem(w, 400, "link title and expiry from 1 to 168 hours are required")
		return
	}
	x := ClientUploadLink{ID: newID(), Title: in.Title, PhotoSetID: newID(), ExpiresAt: now().Add(time.Duration(in.Hours) * time.Hour), CreatedAt: now()}
	if in.TemplateID != "" {
		t, e := a.loadTemplate(r, in.TemplateID)
		if e != nil || t.Archived {
			problem(w, 404, "active template not found")
			return
		}
		if t.Version != in.TemplateVersion {
			problem(w, 409, "template changed; reload before starting intake")
			return
		}
		x.Template = &t
	}
	token, digest, err := newSessionToken()
	if err != nil {
		problem(w, 500, "could not create client link")
		return
	}
	tx, err := a.DB.BeginTx(r.Context(), nil)
	if err != nil {
		problem(w, 500, "could not create client link")
		return
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(r.Context(), "INSERT INTO photo_sets(id,organization_id,client_id,title,created_at) VALUES($1,$2,$3,$4,$5)", x.PhotoSetID, userFrom(r).OrganizationID, r.PathValue("clientID"), "Client upload / "+x.Title, x.CreatedAt)
	if err == nil {
		_, err = tx.ExecContext(r.Context(), "INSERT INTO client_upload_links(id,token_hash,organization_id,client_id,photo_set_id,created_by,title,template_snapshot,expires_at,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", x.ID, digest, userFrom(r).OrganizationID, r.PathValue("clientID"), x.PhotoSetID, userFrom(r).ID, x.Title, string(rawJSON(x.Template)), x.ExpiresAt, x.CreatedAt)
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		problem(w, 500, "could not create client link")
		return
	}
	a.audit(r, "create scoped upload link", "client upload", x.ID)
	respond(w, 201, map[string]any{"link": x, "path": "/self-upload/#" + token})
}
func (a *App) changeClientUploadLink(w http.ResponseWriter, r *http.Request, review bool) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	if !a.clientExists(r, r.PathValue("clientID")) {
		problem(w, 404, "client not found")
		return
	}
	x, err := scanUploadLink(a.DB.QueryRowContext(r.Context(), "SELECT "+uploadLinkColumns+" FROM client_upload_links WHERE id=$1 AND client_id=$2 AND organization_id=$3", r.PathValue("linkID"), r.PathValue("clientID"), userFrom(r).OrganizationID))
	if err != nil {
		problem(w, 404, "client link not found")
		return
	}
	column := "revoked_at"
	if review {
		if !a.hasPermission(r.Context(), r.PathValue("clientID")) {
			problem(w, 403, "client permission is inactive")
			return
		}
		if x.ConsultationID == "" {
			problem(w, 409, "no submitted intake to review")
			return
		}
		column = "reviewed_at"
	}
	_, err = a.DB.ExecContext(r.Context(), "UPDATE client_upload_links SET "+column+"=COALESCE("+column+",$1) WHERE id=$2", now(), x.ID)
	if err != nil {
		problem(w, 500, "could not update client link")
		return
	}
	a.audit(r, "update "+column, "client upload", x.ID)
	respond(w, 200, map[string]string{"status": "ok"})
}
func (a *App) revokeClientUploadLink(w http.ResponseWriter, r *http.Request) {
	a.changeClientUploadLink(w, r, false)
}
func (a *App) reviewClientUploadIntake(w http.ResponseWriter, r *http.Request) {
	a.changeClientUploadLink(w, r, true)
}

// This identity exists only inside these narrow handlers. No studio session is
// created and all photo requests are restricted to the fresh link-specific set.
// Caller holds the media lock across token validation and the operation.
func (a *App) scopedUpload(r *http.Request) (*http.Request, ClientUploadLink, error) {
	var x ClientUploadLink
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") || len(header) > 200 {
		return r, x, sql.ErrNoRows
	}
	token := strings.TrimPrefix(header, "Bearer ")
	if len(token) < 32 {
		return r, x, sql.ErrNoRows
	}
	digest := sha256.Sum256([]byte(token))
	var client, org, creator string
	err := a.DB.QueryRowContext(r.Context(), `SELECT l.client_id,l.organization_id,l.created_by FROM client_upload_links l JOIN clients c ON c.id=l.client_id AND c.organization_id=l.organization_id JOIN users u ON u.id=l.created_by AND u.organization_id=l.organization_id AND u.active=TRUE JOIN client_permissions p ON p.client_id=l.client_id AND p.withdrawn_at IS NULL WHERE l.token_hash=$1 AND l.revoked_at IS NULL AND l.expires_at>$2 AND NOT EXISTS(SELECT 1 FROM privacy_tombstones t WHERE t.subject_type='client' AND t.subject_id=l.client_id)`, digest[:], now()).Scan(&client, &org, &creator)
	if err != nil {
		return r, x, err
	}
	x, err = scanUploadLink(a.DB.QueryRowContext(r.Context(), "SELECT "+uploadLinkColumns+" FROM client_upload_links WHERE token_hash=$1", digest[:]))
	if err != nil {
		return r, x, err
	}
	scoped := r.WithContext(context.WithValue(context.WithValue(r.Context(), userKey{}, User{ID: creator, OrganizationID: org}), uploadLinkKey{}, x.ID))
	scoped.SetPathValue("clientID", client)
	return scoped, x, nil
}
func (a *App) withClientUpload(w http.ResponseWriter, r *http.Request, next func(http.ResponseWriter, *http.Request, ClientUploadLink)) {
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("Cache-Control", "no-store")
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	scoped, x, err := a.scopedUpload(r)
	if err != nil {
		problem(w, 404, "client upload link is expired, revoked or unavailable")
		return
	}
	next(w, scoped, x)
}
func (a *App) uploadViews(r *http.Request, x ClientUploadLink) (map[string]string, error) {
	rows, err := a.DB.QueryContext(r.Context(), `SELECT v.view,v.asset_id FROM photo_views v JOIN client_upload_photos p ON p.asset_id=v.asset_id AND p.view=v.view JOIN assets a ON a.id=v.asset_id WHERE v.set_id=$1 AND p.link_id=$2 AND a.client_id=$3 AND a.organization_id=$4`, x.PhotoSetID, x.ID, r.PathValue("clientID"), userFrom(r).OrganizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	views := map[string]string{}
	for rows.Next() {
		var view, id string
		if err = rows.Scan(&view, &id); err != nil {
			return nil, err
		}
		views[view] = id
	}
	return views, rows.Err()
}
func (a *App) clientUploadPortal(w http.ResponseWriter, r *http.Request) {
	a.withClientUpload(w, r, func(w http.ResponseWriter, r *http.Request, x ClientUploadLink) {
		views, err := a.uploadViews(r, x)
		if err != nil {
			problem(w, 500, "could not load uploaded views")
			return
		}
		missing := []string{}
		for _, v := range requiredPhotoViews {
			if views[v] == "" {
				missing = append(missing, v)
			}
		}
		// Only the client's own submission is returned. No professional observations,
		// existing consultations, other photo sets, models or gallery are disclosed.
		var intake any
		if x.ConsultationID != "" {
			c, e := scanConsultation(a.DB.QueryRowContext(r.Context(), "SELECT "+consultationColumns+" FROM consultations WHERE id=$1 AND client_id=$2", x.ConsultationID, r.PathValue("clientID")))
			if e != nil {
				problem(w, 500, "could not load submitted intake")
				return
			}
			intake = map[string]any{"fields": c.Fields, "answers": c.Answers}
		}
		reminders, e := a.reminders(r, true)
		if e != nil {
			problem(w, 500, "could not load reminders")
			return
		}
		respond(w, 200, map[string]any{"title": x.Title, "expiresAt": x.ExpiresAt, "template": x.Template, "views": views, "missing": missing, "intake": intake, "submittedAt": x.SubmittedAt, "reviewedAt": x.ReviewedAt, "notice": permissionText, "reminders": reminders})
	})
}
func (a *App) clientUploadPhoto(w http.ResponseWriter, r *http.Request) {
	a.withClientUpload(w, r, func(w http.ResponseWriter, r *http.Request, x ClientUploadLink) {
		if !validPhotoView(r.PathValue("view")) {
			problem(w, 400, "invalid photo view")
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 12<<20)
		if err := r.ParseMultipartForm(12 << 20); err != nil {
			problem(w, 400, "image is too large or invalid")
			return
		}
		defer r.MultipartForm.RemoveAll()
		if supplied := r.FormValue("photoSetId"); supplied != "" && supplied != x.PhotoSetID {
			problem(w, 403, "this link only permits its own photo set")
			return
		}
		r.MultipartForm.Value["photoSetId"] = []string{x.PhotoSetID}
		r.MultipartForm.Value["view"] = []string{r.PathValue("view")}
		r.Form.Set("photoSetId", x.PhotoSetID)
		r.Form.Set("view", r.PathValue("view"))
		a.uploadAssetLocked(w, r)
	})
}
func (a *App) clientUploadContent(w http.ResponseWriter, r *http.Request) {
	a.withClientUpload(w, r, func(w http.ResponseWriter, r *http.Request, x ClientUploadLink) {
		if !validPhotoView(r.PathValue("view")) {
			problem(w, 404, "photo view not found")
			return
		}
		views, err := a.uploadViews(r, x)
		if err != nil || views[r.PathValue("view")] == "" {
			problem(w, 404, "photo view not found")
			return
		}
		r.SetPathValue("assetID", views[r.PathValue("view")])
		a.assetContent(w, r)
	})
}
func (a *App) clientUploadIntake(w http.ResponseWriter, r *http.Request) {
	a.withClientUpload(w, r, func(w http.ResponseWriter, r *http.Request, x ClientUploadLink) {
		if x.ConsultationID != "" {
			problem(w, 409, "intake already submitted; ask the professional to record a revision")
			return
		}
		var in struct {
			Goal        string            `json:"goal"`
			Maintenance string            `json:"maintenance"`
			Routine     string            `json:"routine"`
			Likes       string            `json:"likes"`
			Dislikes    string            `json:"dislikes"`
			Answers     map[string]string `json:"answers"`
		}
		if err := decodeJSON(r, &in); err != nil {
			badRequest(w, err)
			return
		}
		fields := ConsultationFields{Goal: in.Goal, Maintenance: in.Maintenance, Routine: in.Routine, Likes: in.Likes, Dislikes: in.Dislikes}
		if err := validateConsultation(&fields); err != nil {
			badRequest(w, err)
			return
		}
		if in.Answers == nil {
			in.Answers = map[string]string{}
		}
		allowed := map[string]bool{}
		if x.Template != nil {
			for _, q := range x.Template.Questions {
				allowed[q.ID] = true
				in.Answers[q.ID] = strings.TrimSpace(in.Answers[q.ID])
				if q.Required && in.Answers[q.ID] == "" {
					problem(w, 400, "required intake answer is missing: "+q.Label)
					return
				}
			}
		}
		for k, v := range in.Answers {
			if !allowed[k] || len(v) > 4000 {
				problem(w, 400, "invalid intake answer")
				return
			}
		}
		id := newID()
		tx, err := a.DB.BeginTx(r.Context(), nil)
		if err != nil {
			problem(w, 500, "could not save intake")
			return
		}
		defer tx.Rollback()
		_, err = tx.ExecContext(r.Context(), "INSERT INTO consultations(id,organization_id,client_id,series_id,revision,title,fields,template_snapshot,answers,created_by,created_at) VALUES($1,$2,$3,$1,1,$4,$5,$6,$7,$8,$9)", id, userFrom(r).OrganizationID, r.PathValue("clientID"), "Client intake / "+x.Title, string(rawJSON(fields)), string(rawJSON(x.Template)), string(rawJSON(in.Answers)), userFrom(r).ID, now())
		if err == nil {
			_, err = tx.ExecContext(r.Context(), "UPDATE client_upload_links SET consultation_id=$1,submitted_at=$2 WHERE id=$3", id, now(), x.ID)
		}
		if err == nil {
			_, err = tx.ExecContext(r.Context(), "UPDATE photo_sets SET consultation_id=$1 WHERE id=$2", id, x.PhotoSetID)
		}
		if err == nil {
			err = tx.Commit()
		}
		if err != nil {
			problem(w, 500, "could not save intake")
			return
		}
		a.audit(r, "client submitted intake", "client upload", x.ID)
		respond(w, 201, map[string]string{"status": "submitted for professional review"})
	})
}
