package app

import (
	"net/http"
	"strings"
	"time"
)

type AdminUser struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Role      string    `json:"role"`
	Active    bool      `json:"active"`
	CreatedAt time.Time `json:"createdAt"`
}

func (a *App) listUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := a.DB.QueryContext(r.Context(), "SELECT id,email,name,role,active,created_at FROM users WHERE organization_id=$1 ORDER BY created_at", userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load users")
		return
	}
	defer rows.Close()
	items := []AdminUser{}
	for rows.Next() {
		var x AdminUser
		if err = rows.Scan(&x.ID, &x.Email, &x.Name, &x.Role, &x.Active, &x.CreatedAt); err != nil {
			problem(w, 500, "could not load users")
			return
		}
		items = append(items, x)
	}
	respond(w, 200, items)
}

func (a *App) createUser(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email    string `json:"email"`
		Name     string `json:"name"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	in.Name = strings.TrimSpace(in.Name)
	if len(in.Email) < 5 || len(in.Email) > 254 || !strings.Contains(in.Email, "@") || len(in.Name) < 2 || len(in.Name) > 160 || (in.Role != "admin" && in.Role != "professional") {
		problem(w, 400, "invalid user fields")
		return
	}
	hash, err := hashPassword(in.Password)
	if err != nil {
		badRequest(w, err)
		return
	}
	x := AdminUser{ID: newID(), Email: in.Email, Name: in.Name, Role: in.Role, Active: true, CreatedAt: now()}
	_, err = a.DB.ExecContext(r.Context(), "INSERT INTO users(id,organization_id,email,name,password_hash,role,active,created_at) VALUES($1,$2,$3,$4,$5,$6,1,$7)", x.ID, userFrom(r).OrganizationID, x.Email, x.Name, hash, x.Role, x.CreatedAt)
	if err != nil {
		problem(w, 409, "user already exists or could not be created")
		return
	}
	a.audit(r, "create", "user", x.ID)
	respond(w, 201, x)
}

func (a *App) updateUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("userID")
	if !isID(id) {
		problem(w, 404, "user not found")
		return
	}
	var in struct {
		Name     string `json:"name"`
		Role     string `json:"role"`
		Active   bool   `json:"active"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	if len(in.Name) < 2 || len(in.Name) > 160 || (in.Role != "admin" && in.Role != "professional") {
		problem(w, 400, "invalid user fields")
		return
	}
	if id == userFrom(r).ID && (!in.Active || in.Role != "admin") {
		problem(w, 400, "cannot remove your own admin access")
		return
	}
	var hash string
	if in.Password != "" {
		var err error
		hash, err = hashPassword(in.Password)
		if err != nil {
			badRequest(w, err)
			return
		}
	}
	cmd, err := a.DB.ExecContext(r.Context(), "UPDATE users SET name=$1,role=$2,active=$3,password_hash=CASE WHEN $4='' THEN password_hash ELSE $4 END WHERE id=$5 AND organization_id=$6", in.Name, in.Role, in.Active, hash, id, userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not update user")
		return
	}
	affected, err := cmd.RowsAffected()
	if err != nil {
		problem(w, 500, "could not update user")
		return
	}
	if affected == 0 {
		problem(w, 404, "user not found")
		return
	}
	if !in.Active || hash != "" {
		_, _ = a.DB.ExecContext(r.Context(), "DELETE FROM sessions WHERE user_id=$1", id)
	}
	a.audit(r, "update", "user", id)
	respond(w, 200, map[string]string{"status": "ok"})
}

type AuditEvent struct {
	ID          string    `json:"id"`
	ActorName   string    `json:"actorName"`
	Action      string    `json:"action"`
	SubjectType string    `json:"subjectType"`
	SubjectID   string    `json:"subjectId"`
	CreatedAt   time.Time `json:"createdAt"`
}

func (a *App) listAudit(w http.ResponseWriter, r *http.Request) {
	rows, err := a.DB.QueryContext(r.Context(), "SELECT e.id,COALESCE(u.name,'System'),e.action,e.subject_type,e.subject_id,e.created_at FROM audit_events e LEFT JOIN users u ON u.id=e.actor_id WHERE e.organization_id=$1 ORDER BY e.created_at DESC LIMIT 100", userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load audit history")
		return
	}
	defer rows.Close()
	items := []AuditEvent{}
	for rows.Next() {
		var x AuditEvent
		if err = rows.Scan(&x.ID, &x.ActorName, &x.Action, &x.SubjectType, &x.SubjectID, &x.CreatedAt); err != nil {
			problem(w, 500, "could not load audit history")
			return
		}
		items = append(items, x)
	}
	respond(w, 200, items)
}
