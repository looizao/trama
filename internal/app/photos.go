package app

import (
	"database/sql"
	"net/http"
	"strings"
	"time"
)

var requiredPhotoViews = []string{"front", "left-three-quarter", "right-three-quarter", "left-profile", "right-profile", "back"}

func validPhotoView(view string) bool {
	for _, v := range append(append([]string{}, requiredPhotoViews...), "crown", "under-chin") {
		if v == view {
			return true
		}
	}
	return false
}

type PhotoSet struct {
	ID             string            `json:"id"`
	ClientID       string            `json:"clientId"`
	ConsultationID string            `json:"consultationId"`
	Title          string            `json:"title"`
	CreatedAt      time.Time         `json:"createdAt"`
	Views          map[string]string `json:"views"`
	Missing        []string          `json:"missing"`
}

func (a *App) photoSetExists(r *http.Request, id, client string) bool {
	var found string
	return a.DB.QueryRowContext(r.Context(), "SELECT id FROM photo_sets WHERE id=$1 AND organization_id=$2 AND client_id=$3", id, userFrom(r).OrganizationID, client).Scan(&found) == nil
}
func (a *App) listPhotoSets(w http.ResponseWriter, r *http.Request) {
	client := r.PathValue("clientID")
	if !a.clientExists(r, client) {
		problem(w, 404, "client not found")
		return
	}
	rows, err := a.DB.QueryContext(r.Context(), "SELECT id,client_id,COALESCE(consultation_id,''),title,created_at FROM photo_sets WHERE client_id=$1 AND organization_id=$2 ORDER BY created_at DESC", client, userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load photo sets")
		return
	}
	items := []PhotoSet{}
	for rows.Next() {
		var s PhotoSet
		if err = rows.Scan(&s.ID, &s.ClientID, &s.ConsultationID, &s.Title, &s.CreatedAt); err != nil {
			rows.Close()
			problem(w, 500, "could not load photo sets")
			return
		}
		s.Views = map[string]string{}
		s.Missing = []string{}
		items = append(items, s)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		problem(w, 500, "could not load photo sets")
		return
	}
	for i := range items {
		views, e := a.DB.QueryContext(r.Context(), "SELECT view,asset_id FROM photo_views WHERE set_id=$1", items[i].ID)
		if e != nil {
			problem(w, 500, "could not load photo views")
			return
		}
		for views.Next() {
			var v, id string
			if e = views.Scan(&v, &id); e != nil {
				views.Close()
				problem(w, 500, "could not load photo views")
				return
			}
			items[i].Views[v] = id
		}
		e = views.Err()
		views.Close()
		if e != nil {
			problem(w, 500, "could not load photo views")
			return
		}
		for _, v := range requiredPhotoViews {
			if items[i].Views[v] == "" {
				items[i].Missing = append(items[i].Missing, v)
			}
		}
	}
	respond(w, 200, items)
}
func (a *App) createPhotoSet(w http.ResponseWriter, r *http.Request) {
	client := r.PathValue("clientID")
	if !a.clientExists(r, client) {
		problem(w, 404, "client not found")
		return
	}
	var in struct {
		Title          string `json:"title"`
		ConsultationID string `json:"consultationId"`
	}
	if err := decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Title = strings.TrimSpace(in.Title)
	if len(in.Title) < 2 || len(in.Title) > 160 {
		problem(w, 400, "photo set title is required")
		return
	}
	var consultation any
	if in.ConsultationID != "" {
		var found string
		if err := a.DB.QueryRowContext(r.Context(), "SELECT id FROM consultations WHERE id=$1 AND client_id=$2 AND organization_id=$3", in.ConsultationID, client, userFrom(r).OrganizationID).Scan(&found); err != nil {
			problem(w, 404, "consultation not found")
			return
		}
		consultation = in.ConsultationID
	}
	s := PhotoSet{ID: newID(), ClientID: client, Title: in.Title, ConsultationID: in.ConsultationID, CreatedAt: now(), Views: map[string]string{}, Missing: append([]string{}, requiredPhotoViews...)}
	if _, err := a.DB.ExecContext(r.Context(), "INSERT INTO photo_sets(id,organization_id,client_id,consultation_id,title,created_at) VALUES($1,$2,$3,$4,$5,$6)", s.ID, userFrom(r).OrganizationID, client, consultation, s.Title, s.CreatedAt); err != nil {
		problem(w, 500, "could not save photo set")
		return
	}
	respond(w, 201, s)
}

// Caller holds the media lock across validation, storage and metadata writes.
func (a *App) photoSlotMatches(r *http.Request, set, view, expected string) bool {
	var current string
	err := a.DB.QueryRowContext(r.Context(), "SELECT asset_id FROM photo_views WHERE set_id=$1 AND view=$2", set, view).Scan(&current)
	return (err == sql.ErrNoRows && expected == "") || (err == nil && current == expected)
}
func (a *App) assignPhotoView(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	set, view := r.PathValue("setID"), r.PathValue("view")
	var client string
	if err = a.DB.QueryRowContext(r.Context(), "SELECT client_id FROM photo_sets WHERE id=$1 AND organization_id=$2", set, userFrom(r).OrganizationID).Scan(&client); err != nil {
		problem(w, 404, "photo set not found")
		return
	}
	if !validPhotoView(view) {
		problem(w, 400, "invalid photo view")
		return
	}
	var in struct {
		AssetID         string `json:"assetId"`
		ExpectedAssetID string `json:"expectedAssetId"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	if !a.photoSlotMatches(r, set, view, in.ExpectedAssetID) {
		problem(w, 409, "photo view changed; reload before replacing")
		return
	}
	if in.AssetID == "" {
		_, err = a.DB.ExecContext(r.Context(), "DELETE FROM photo_views WHERE set_id=$1 AND view=$2", set, view)
	} else {
		if !a.hasPermission(r.Context(), client) {
			problem(w, 403, "client acknowledgement is required before storing or processing media")
			return
		}
		var found string
		if err = a.DB.QueryRowContext(r.Context(), "SELECT id FROM assets WHERE id=$1 AND client_id=$2 AND organization_id=$3 AND kind='source'", in.AssetID, client, userFrom(r).OrganizationID).Scan(&found); err != nil {
			problem(w, 404, "source image not found")
			return
		}
		var other string
		if err = a.DB.QueryRowContext(r.Context(), "SELECT view FROM photo_views WHERE set_id=$1 AND asset_id=$2 AND view<>$3", set, in.AssetID, view).Scan(&other); err == nil {
			problem(w, 409, "this photo already belongs to another view in this set")
			return
		} else if err != sql.ErrNoRows {
			problem(w, 500, "could not verify photo assignment")
			return
		}
		_, err = a.DB.ExecContext(r.Context(), "INSERT INTO photo_views(set_id,view,asset_id) VALUES($1,$2,$3) ON CONFLICT(set_id,view) DO UPDATE SET asset_id=excluded.asset_id", set, view, in.AssetID)
	}
	if err != nil {
		problem(w, 500, "could not save photo view")
		return
	}
	a.audit(r, "assign view", "photo set", set)
	respond(w, 200, map[string]string{"status": "ok"})
}
