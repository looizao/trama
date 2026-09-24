package app

import (
	"net/http"
	"strings"
	"time"
)

type ClientRecord struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"createdAt"`
}

type CaseRecord struct {
	ID          string    `json:"id"`
	ClientID    string    `json:"clientId"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
}

type Milestone struct {
	ID        string    `json:"id"`
	CaseID    string    `json:"caseId"`
	Title     string    `json:"title"`
	Position  int       `json:"position"`
	CreatedAt time.Time `json:"createdAt"`
}

func (a *App) clientExists(r *http.Request, id string) bool {
	if !isID(id) {
		return false
	}
	var found string
	return a.DB.QueryRow(r.Context(), "SELECT id FROM clients WHERE id=$1 AND organization_id=$2", id, userFrom(r).OrganizationID).Scan(&found) == nil
}

func (a *App) caseExists(r *http.Request, id string) bool {
	if !isID(id) {
		return false
	}
	var found string
	return a.DB.QueryRow(r.Context(), "SELECT id FROM cases WHERE id=$1 AND organization_id=$2", id, userFrom(r).OrganizationID).Scan(&found) == nil
}

func (a *App) listClients(w http.ResponseWriter, r *http.Request) {
	u := userFrom(r)
	rows, err := a.DB.Query(r.Context(), "SELECT id,name,email,notes,created_at FROM clients WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 500", u.OrganizationID)
	if err != nil {
		problem(w, 500, "could not load clients")
		return
	}
	defer rows.Close()
	items := []ClientRecord{}
	for rows.Next() {
		var x ClientRecord
		if err = rows.Scan(&x.ID, &x.Name, &x.Email, &x.Notes, &x.CreatedAt); err != nil {
			problem(w, 500, "could not load clients")
			return
		}
		items = append(items, x)
	}
	respond(w, 200, items)
}

func (a *App) createClient(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Notes string `json:"notes"`
	}
	if err := decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.TrimSpace(in.Email)
	if len(in.Name) < 2 || len(in.Name) > 160 || len(in.Email) > 254 || len(in.Notes) > 10000 {
		problem(w, 400, "invalid client fields")
		return
	}
	u := userFrom(r)
	x := ClientRecord{ID: newID(), Name: in.Name, Email: in.Email, Notes: in.Notes, CreatedAt: now()}
	_, err := a.DB.Exec(r.Context(), "INSERT INTO clients(id,organization_id,name,email,notes,created_at) VALUES($1,$2,$3,$4,$5,$6)", x.ID, u.OrganizationID, x.Name, x.Email, x.Notes, x.CreatedAt)
	if err != nil {
		problem(w, 500, "could not create client")
		return
	}
	a.audit(r, "create", "client", x.ID)
	respond(w, 201, x)
}

func (a *App) getClient(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("clientID")
	if !isID(id) {
		problem(w, 404, "client not found")
		return
	}
	var x ClientRecord
	err := a.DB.QueryRow(r.Context(), "SELECT id,name,email,notes,created_at FROM clients WHERE id=$1 AND organization_id=$2", id, userFrom(r).OrganizationID).Scan(&x.ID, &x.Name, &x.Email, &x.Notes, &x.CreatedAt)
	if err != nil {
		problem(w, 404, "client not found")
		return
	}
	respond(w, 200, x)
}

func (a *App) updateClient(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("clientID")
	if !a.clientExists(r, id) {
		problem(w, 404, "client not found")
		return
	}
	var in struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Notes string `json:"notes"`
	}
	if err := decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.TrimSpace(in.Email)
	if len(in.Name) < 2 || len(in.Name) > 160 || len(in.Email) > 254 || len(in.Notes) > 10000 {
		problem(w, 400, "invalid client fields")
		return
	}
	_, err := a.DB.Exec(r.Context(), "UPDATE clients SET name=$1,email=$2,notes=$3,updated_at=now() WHERE id=$4 AND organization_id=$5", in.Name, in.Email, in.Notes, id, userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not update client")
		return
	}
	a.audit(r, "update", "client", id)
	a.getClient(w, r)
}

func (a *App) listCases(w http.ResponseWriter, r *http.Request) {
	clientID := r.PathValue("clientID")
	if !a.clientExists(r, clientID) {
		problem(w, 404, "client not found")
		return
	}
	rows, err := a.DB.Query(r.Context(), "SELECT id,client_id,title,description,created_at FROM cases WHERE client_id=$1 AND organization_id=$2 ORDER BY created_at DESC", clientID, userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load cases")
		return
	}
	defer rows.Close()
	items := []CaseRecord{}
	for rows.Next() {
		var x CaseRecord
		if err = rows.Scan(&x.ID, &x.ClientID, &x.Title, &x.Description, &x.CreatedAt); err != nil {
			problem(w, 500, "could not load cases")
			return
		}
		items = append(items, x)
	}
	respond(w, 200, items)
}

func (a *App) createCase(w http.ResponseWriter, r *http.Request) {
	clientID := r.PathValue("clientID")
	if !a.clientExists(r, clientID) {
		problem(w, 404, "client not found")
		return
	}
	var in struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	}
	if err := decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Title = strings.TrimSpace(in.Title)
	if len(in.Title) < 2 || len(in.Title) > 160 || len(in.Description) > 10000 {
		problem(w, 400, "invalid case fields")
		return
	}
	x := CaseRecord{ID: newID(), ClientID: clientID, Title: in.Title, Description: in.Description, CreatedAt: now()}
	_, err := a.DB.Exec(r.Context(), "INSERT INTO cases(id,organization_id,client_id,title,description,created_at) VALUES($1,$2,$3,$4,$5,$6)", x.ID, userFrom(r).OrganizationID, x.ClientID, x.Title, x.Description, x.CreatedAt)
	if err != nil {
		problem(w, 500, "could not create case")
		return
	}
	a.audit(r, "create", "case", x.ID)
	respond(w, 201, x)
}

func (a *App) getCase(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("caseID")
	if !isID(id) {
		problem(w, 404, "case not found")
		return
	}
	var x CaseRecord
	err := a.DB.QueryRow(r.Context(), "SELECT id,client_id,title,description,created_at FROM cases WHERE id=$1 AND organization_id=$2", id, userFrom(r).OrganizationID).Scan(&x.ID, &x.ClientID, &x.Title, &x.Description, &x.CreatedAt)
	if err != nil {
		problem(w, 404, "case not found")
		return
	}
	respond(w, 200, x)
}

func (a *App) listMilestones(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("caseID")
	if !a.caseExists(r, id) {
		problem(w, 404, "case not found")
		return
	}
	rows, err := a.DB.Query(r.Context(), "SELECT id,case_id,title,position,created_at FROM milestones WHERE case_id=$1 AND organization_id=$2 ORDER BY position", id, userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load milestones")
		return
	}
	defer rows.Close()
	items := []Milestone{}
	for rows.Next() {
		var x Milestone
		if err = rows.Scan(&x.ID, &x.CaseID, &x.Title, &x.Position, &x.CreatedAt); err != nil {
			problem(w, 500, "could not load milestones")
			return
		}
		items = append(items, x)
	}
	respond(w, 200, items)
}

func (a *App) createMilestone(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("caseID")
	if !a.caseExists(r, id) {
		problem(w, 404, "case not found")
		return
	}
	var in struct {
		Title string `json:"title"`
	}
	if err := decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Title = strings.TrimSpace(in.Title)
	if len(in.Title) < 2 || len(in.Title) > 160 {
		problem(w, 400, "invalid milestone title")
		return
	}
	x := Milestone{ID: newID(), CaseID: id, Title: in.Title, CreatedAt: now()}
	err := a.DB.QueryRow(r.Context(), "INSERT INTO milestones(id,organization_id,case_id,title,position,created_at) VALUES($1,$2,$3,$4,(SELECT COALESCE(MAX(position),0)+1 FROM milestones WHERE case_id=$3),$5) RETURNING position", x.ID, userFrom(r).OrganizationID, id, x.Title, x.CreatedAt).Scan(&x.Position)
	if err != nil {
		problem(w, 500, "could not create milestone")
		return
	}
	a.audit(r, "create", "milestone", x.ID)
	respond(w, 201, x)
}
