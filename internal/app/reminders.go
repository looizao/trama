package app

import (
	"net/http"
	"strings"
	"time"
)

type ClientReminder struct {
	ID            string    `json:"id"`
	ClientID      string    `json:"clientId,omitempty"`
	ClientName    string    `json:"clientName,omitempty"`
	Title         string    `json:"title"`
	Message       string    `json:"message"`
	DueAt         time.Time `json:"dueAt"`
	ClientVisible bool      `json:"clientVisible"`
	Status        string    `json:"status"`
	Version       int       `json:"version"`
	Due           bool      `json:"due"`
}

func (a *App) reminders(r *http.Request, portal bool) ([]ClientReminder, error) {
	query := `SELECT r.id,r.client_id,c.name,r.title,r.message,r.due_at,r.client_visible,r.status,r.version FROM client_reminders r JOIN clients c ON c.id=r.client_id WHERE r.organization_id=$1`
	args := []any{userFrom(r).OrganizationID}
	if client := r.PathValue("clientID"); client != "" {
		query += " AND r.client_id=$2"
		args = append(args, client)
	}
	if portal {
		query += " AND r.client_visible=TRUE AND r.status='pending'"
	}
	query += " ORDER BY r.due_at,r.created_at"
	rows, err := a.DB.QueryContext(r.Context(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []ClientReminder{}
	for rows.Next() {
		var x ClientReminder
		if err = rows.Scan(&x.ID, &x.ClientID, &x.ClientName, &x.Title, &x.Message, &x.DueAt, &x.ClientVisible, &x.Status, &x.Version); err != nil {
			return nil, err
		}
		x.Due = x.Status == "pending" && !x.DueAt.After(now())
		if portal {
			x.ClientID = ""
			x.ClientName = ""
		}
		items = append(items, x)
	}
	return items, rows.Err()
}
func (a *App) listClientReminders(w http.ResponseWriter, r *http.Request) {
	if c := r.PathValue("clientID"); c != "" && !a.clientExists(r, c) {
		problem(w, 404, "client not found")
		return
	}
	items, err := a.reminders(r, false)
	if err != nil {
		problem(w, 500, "could not load reminders")
		return
	}
	respond(w, 200, items)
}
func (a *App) createClientReminder(w http.ResponseWriter, r *http.Request) {
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
		Title         string    `json:"title"`
		Message       string    `json:"message"`
		DueAt         time.Time `json:"dueAt"`
		ClientVisible bool      `json:"clientVisible"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Title = strings.TrimSpace(in.Title)
	in.Message = strings.TrimSpace(in.Message)
	if len(in.Title) < 2 || len(in.Title) > 160 || len(in.Message) > 2000 || in.DueAt.IsZero() {
		problem(w, 400, "reminder title and due date are required")
		return
	}
	x := ClientReminder{ID: newID(), ClientID: r.PathValue("clientID"), Title: in.Title, Message: in.Message, DueAt: in.DueAt.UTC(), ClientVisible: in.ClientVisible, Status: "pending", Version: 1, Due: !in.DueAt.After(now())}
	_, err = a.DB.ExecContext(r.Context(), "INSERT INTO client_reminders(id,organization_id,client_id,title,message,due_at,client_visible,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8)", x.ID, userFrom(r).OrganizationID, x.ClientID, x.Title, x.Message, x.DueAt, x.ClientVisible, now())
	if err != nil {
		problem(w, 500, "could not save reminder")
		return
	}
	respond(w, 201, x)
}
func (a *App) updateClientReminder(w http.ResponseWriter, r *http.Request) {
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
		Version int    `json:"version"`
		Status  string `json:"status"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	if in.Status != "completed" && in.Status != "dismissed" {
		problem(w, 400, "complete or dismiss the reminder")
		return
	}
	var old string
	var version int
	if a.DB.QueryRowContext(r.Context(), "SELECT status,version FROM client_reminders WHERE id=$1 AND client_id=$2 AND organization_id=$3", r.PathValue("reminderID"), r.PathValue("clientID"), userFrom(r).OrganizationID).Scan(&old, &version) != nil {
		problem(w, 404, "reminder not found")
		return
	}
	if old != "pending" || version != in.Version {
		problem(w, 409, "reminder changed; reload before updating")
		return
	}
	_, err = a.DB.ExecContext(r.Context(), "UPDATE client_reminders SET status=$1,version=version+1,updated_at=$2 WHERE id=$3 AND version=$4", in.Status, now(), r.PathValue("reminderID"), version)
	if err != nil {
		problem(w, 500, "could not update reminder")
		return
	}
	respond(w, 200, map[string]string{"status": in.Status})
}
