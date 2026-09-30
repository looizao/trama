package app

import (
	"net/http"
	"net/url"
	"strings"
	"time"
)

type StyleReference struct {
	ID        string    `json:"id"`
	ClientID  string    `json:"clientId"`
	AssetID   string    `json:"assetId"`
	Kind      string    `json:"kind"`
	StyleID   string    `json:"styleId"`
	Title     string    `json:"title"`
	Notes     string    `json:"notes"`
	Creator   string    `json:"creator"`
	License   string    `json:"license"`
	SourceURL string    `json:"sourceUrl"`
	CreatedAt time.Time `json:"createdAt"`
}

func (a *App) listStyleReferences(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	client := r.PathValue("clientID")
	if !a.clientExists(r, client) {
		problem(w, 404, "client not found")
		return
	}
	rows, err := a.DB.QueryContext(r.Context(), `SELECT s.id,s.client_id,s.asset_id,s.kind,s.style_id,s.title,s.notes,s.creator,s.license,s.source_url,s.created_at FROM style_references s JOIN assets a ON a.id=s.asset_id AND a.client_id=s.client_id AND a.organization_id=s.organization_id JOIN client_permissions p ON p.client_id=s.client_id AND p.withdrawn_at IS NULL WHERE s.organization_id=$1 AND s.client_id=$2 ORDER BY s.created_at DESC`, userFrom(r).OrganizationID, client)
	if err != nil {
		problem(w, 500, "could not load private references")
		return
	}
	defer rows.Close()
	items := []StyleReference{}
	for rows.Next() {
		var s StyleReference
		if err = rows.Scan(&s.ID, &s.ClientID, &s.AssetID, &s.Kind, &s.StyleID, &s.Title, &s.Notes, &s.Creator, &s.License, &s.SourceURL, &s.CreatedAt); err != nil {
			problem(w, 500, "could not load private references")
			return
		}
		items = append(items, s)
	}
	if rows.Err() != nil {
		problem(w, 500, "could not load private references")
		return
	}
	w.Header().Set("Cache-Control", "private, no-store")
	respond(w, 200, items)
}

func (a *App) createStyleReference(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	client := r.PathValue("clientID")
	if !a.clientExists(r, client) {
		problem(w, 404, "client not found")
		return
	}
	if !a.hasPermission(r.Context(), client) {
		problem(w, 403, "active client permission is required")
		return
	}
	var in struct {
		StyleReference
		RightsConfirmed bool `json:"rightsConfirmed"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	s := in.StyleReference
	s.Title = strings.TrimSpace(s.Title)
	s.Notes = strings.TrimSpace(s.Notes)
	s.Creator = strings.TrimSpace(s.Creator)
	s.SourceURL = strings.TrimSpace(s.SourceURL)
	if !in.RightsConfirmed || len(s.Title) < 2 || len(s.Title) > 160 || len(s.Notes) > 2000 || len(s.Creator) < 2 || len(s.Creator) > 160 || len(s.SourceURL) > 1000 {
		problem(w, 400, "reference title, creator and affirmative reuse rights are required")
		return
	}
	if s.License != "professional-owned" && s.License != "CC0-1.0" && s.License != "CC-BY-4.0" {
		problem(w, 400, "use commercially reusable reference rights")
		return
	}
	if s.SourceURL != "" {
		u, e := url.Parse(s.SourceURL)
		if e != nil || (u.Scheme != "https" && u.Scheme != "http") || u.Host == "" || u.User != nil {
			problem(w, 400, "use a public HTTP source URL without credentials")
			return
		}
	}
	if s.License != "professional-owned" && s.SourceURL == "" {
		problem(w, 400, "licensed reference source URL is required")
		return
	}
	styles, e := readDemoStyles(s.Kind)
	found := false
	if e == nil {
		for _, style := range styles {
			if style.ID == s.StyleID {
				found = true
				break
			}
		}
	}
	if !found {
		problem(w, 400, "choose an existing reusable 3D style")
		return
	}
	var count int
	err = a.DB.QueryRowContext(r.Context(), "SELECT count(*) FROM assets WHERE id=$1 AND client_id=$2 AND organization_id=$3", s.AssetID, client, userFrom(r).OrganizationID).Scan(&count)
	if err != nil {
		problem(w, 500, "could not check reference source")
		return
	}
	if count != 1 {
		problem(w, 404, "authorized reference source not found")
		return
	}
	s.ID = newID()
	s.ClientID = client
	s.CreatedAt = now()
	_, err = a.DB.ExecContext(r.Context(), `INSERT INTO style_references(id,organization_id,client_id,asset_id,kind,style_id,title,notes,creator,license,source_url,created_by,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, s.ID, userFrom(r).OrganizationID, client, s.AssetID, s.Kind, s.StyleID, s.Title, s.Notes, s.Creator, s.License, s.SourceURL, userFrom(r).ID, s.CreatedAt)
	if err != nil {
		problem(w, 500, "could not retain private reference")
		return
	}
	respond(w, 201, s)
}

func (a *App) removeStyleReference(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	result, err := a.DB.ExecContext(r.Context(), "DELETE FROM style_references WHERE id=$1 AND organization_id=$2", r.PathValue("referenceID"), userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not remove reference association")
		return
	}
	n, _ := result.RowsAffected()
	if n != 1 {
		problem(w, 404, "private reference not found")
		return
	}
	respond(w, 200, map[string]string{"status": "reference association removed; source media retains its existing lifecycle"})
}
