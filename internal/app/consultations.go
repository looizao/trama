package app

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"
)

type IntakeQuestion struct {
	ID       string `json:"id"`
	Label    string `json:"label"`
	Required bool   `json:"required"`
}
type IntakeTemplate struct {
	ID        string           `json:"id"`
	Name      string           `json:"name"`
	Version   int              `json:"version"`
	Questions []IntakeQuestion `json:"questions"`
	Archived  bool             `json:"archived"`
	UpdatedAt time.Time        `json:"updatedAt"`
}
type ConsultationFields struct {
	Goal               string `json:"goal"`
	Maintenance        string `json:"maintenance"`
	MaintenanceDetails string `json:"maintenanceDetails"`
	Likes              string `json:"likes"`
	Dislikes           string `json:"dislikes"`
	NonNegotiables     string `json:"nonNegotiables"`
	Routine            string `json:"routine"`
	HairTexture        string `json:"hairTexture"`
	HairDensity        string `json:"hairDensity"`
	GrowthDirection    string `json:"growthDirection"`
	CurrentLengths     string `json:"currentLengths"`
	BeardCoverage      string `json:"beardCoverage"`
	Observations       string `json:"observations"`
	Rationale          string `json:"rationale"`
}
type Consultation struct {
	ID        string             `json:"id"`
	ClientID  string             `json:"clientId"`
	SeriesID  string             `json:"seriesId"`
	Revision  int                `json:"revision"`
	Title     string             `json:"title"`
	Fields    ConsultationFields `json:"fields"`
	Template  *IntakeTemplate    `json:"template"`
	Answers   map[string]string  `json:"answers"`
	CreatedBy string             `json:"createdBy"`
	CreatedAt time.Time          `json:"createdAt"`
}

func (a *App) loadTemplate(r *http.Request, id string) (IntakeTemplate, error) {
	var t IntakeTemplate
	var raw string
	err := a.DB.QueryRowContext(r.Context(), "SELECT id,name,version,questions,archived,updated_at FROM intake_templates WHERE id=$1 AND organization_id=$2", id, userFrom(r).OrganizationID).Scan(&t.ID, &t.Name, &t.Version, &raw, &t.Archived, &t.UpdatedAt)
	if err == nil {
		err = json.Unmarshal([]byte(raw), &t.Questions)
	}
	return t, err
}
func (a *App) listTemplates(w http.ResponseWriter, r *http.Request) {
	rows, err := a.DB.QueryContext(r.Context(), "SELECT id,name,version,questions,archived,updated_at FROM intake_templates WHERE organization_id=$1 ORDER BY name", userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load templates")
		return
	}
	defer rows.Close()
	items := []IntakeTemplate{}
	for rows.Next() {
		var t IntakeTemplate
		var raw string
		if err = rows.Scan(&t.ID, &t.Name, &t.Version, &raw, &t.Archived, &t.UpdatedAt); err != nil {
			problem(w, 500, "could not load templates")
			return
		}
		if err = json.Unmarshal([]byte(raw), &t.Questions); err != nil {
			problem(w, 500, "invalid stored template")
			return
		}
		items = append(items, t)
	}
	if rows.Err() != nil {
		problem(w, 500, "could not load templates")
		return
	}
	respond(w, 200, items)
}
func (a *App) saveTemplate(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Name      string           `json:"name"`
		Questions []IntakeQuestion `json:"questions"`
		Version   int              `json:"version"`
		Archived  bool             `json:"archived"`
	}
	if err := decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	if len(in.Name) < 2 || len(in.Name) > 160 || len(in.Questions) > 12 {
		problem(w, 400, "invalid template name or questions")
		return
	}
	seen := map[string]bool{}
	for i := range in.Questions {
		q := &in.Questions[i]
		q.ID = strings.TrimSpace(q.ID)
		q.Label = strings.TrimSpace(q.Label)
		if len(q.ID) < 1 || len(q.ID) > 64 || len(q.Label) < 2 || len(q.Label) > 240 || seen[q.ID] {
			problem(w, 400, "invalid or duplicate template question")
			return
		}
		seen[q.ID] = true
	}
	if in.Questions == nil {
		in.Questions = []IntakeQuestion{}
	}
	t := IntakeTemplate{ID: r.PathValue("templateID"), Name: in.Name, Version: 1, Questions: in.Questions, Archived: in.Archived, UpdatedAt: now()}
	var err error
	status := 201
	if r.Method == "POST" {
		t.ID = newID()
		_, err = a.DB.ExecContext(r.Context(), "INSERT INTO intake_templates(id,organization_id,name,questions,archived,updated_at) VALUES($1,$2,$3,$4,$5,$6)", t.ID, userFrom(r).OrganizationID, t.Name, string(rawJSON(t.Questions)), t.Archived, t.UpdatedAt)
	} else {
		if _, e := a.loadTemplate(r, t.ID); e != nil {
			problem(w, 404, "template not found")
			return
		}
		t.Version = in.Version + 1
		status = 200
		var result sql.Result
		result, err = a.DB.ExecContext(r.Context(), "UPDATE intake_templates SET name=$1,questions=$2,version=$3,archived=$4,updated_at=$5 WHERE id=$6 AND organization_id=$7 AND version=$8", t.Name, string(rawJSON(t.Questions)), t.Version, t.Archived, t.UpdatedAt, t.ID, userFrom(r).OrganizationID, in.Version)
		if err == nil {
			count, _ := result.RowsAffected()
			if count == 0 {
				problem(w, 409, "template changed; reload before editing")
				return
			}
		}
	}
	if err != nil {
		problem(w, 500, "could not save template")
		return
	}
	a.audit(r, "save", "intake template", t.ID)
	respond(w, status, t)
}
func validateConsultation(f *ConsultationFields) error {
	values := []*string{&f.Goal, &f.MaintenanceDetails, &f.Likes, &f.Dislikes, &f.NonNegotiables, &f.Routine, &f.HairTexture, &f.HairDensity, &f.GrowthDirection, &f.CurrentLengths, &f.BeardCoverage, &f.Observations, &f.Rationale}
	for _, v := range values {
		*v = strings.TrimSpace(*v)
		if len(*v) > 4000 {
			return errors.New("consultation text is too long")
		}
	}
	if f.Goal == "" {
		return errors.New("client goal is required")
	}
	if f.Maintenance != "low" && f.Maintenance != "moderate" && f.Maintenance != "high" {
		return errors.New("maintenance tolerance is required")
	}
	return nil
}
func scanConsultation(row interface{ Scan(...any) error }) (Consultation, error) {
	var c Consultation
	var fields, template, answers string
	err := row.Scan(&c.ID, &c.ClientID, &c.SeriesID, &c.Revision, &c.Title, &fields, &template, &answers, &c.CreatedBy, &c.CreatedAt)
	if err == nil {
		err = json.Unmarshal([]byte(fields), &c.Fields)
	}
	if err == nil {
		err = json.Unmarshal([]byte(template), &c.Template)
	}
	if err == nil {
		err = json.Unmarshal([]byte(answers), &c.Answers)
	}
	return c, err
}

const consultationColumns = "id,client_id,series_id,revision,title,fields,template_snapshot,answers,created_by,created_at"

func (a *App) listConsultations(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("clientID")
	if !a.clientExists(r, id) {
		problem(w, 404, "client not found")
		return
	}
	rows, err := a.DB.QueryContext(r.Context(), "SELECT "+consultationColumns+" FROM consultations WHERE client_id=$1 AND organization_id=$2 ORDER BY created_at DESC,revision DESC", id, userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load consultations")
		return
	}
	defer rows.Close()
	items := []Consultation{}
	for rows.Next() {
		c, e := scanConsultation(rows)
		if e != nil {
			problem(w, 500, "could not load consultations")
			return
		}
		items = append(items, c)
	}
	if rows.Err() != nil {
		problem(w, 500, "could not load consultations")
		return
	}
	respond(w, 200, items)
}
func (a *App) createConsultation(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("clientID")
	if !a.clientExists(r, id) {
		problem(w, 404, "client not found")
		return
	}
	var in struct {
		Title           string             `json:"title"`
		Fields          ConsultationFields `json:"fields"`
		TemplateID      string             `json:"templateId"`
		TemplateVersion int                `json:"templateVersion"`
		Answers         map[string]string  `json:"answers"`
		RevisesID       string             `json:"revisesId"`
	}
	if err := decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Title = strings.TrimSpace(in.Title)
	if len(in.Title) < 2 || len(in.Title) > 160 {
		problem(w, 400, "consultation title is required")
		return
	}
	if err := validateConsultation(&in.Fields); err != nil {
		badRequest(w, err)
		return
	}
	c := Consultation{ID: newID(), ClientID: id, Title: in.Title, Fields: in.Fields, Answers: in.Answers, Revision: 1, CreatedBy: userFrom(r).ID, CreatedAt: now()}
	c.SeriesID = c.ID
	if c.Answers == nil {
		c.Answers = map[string]string{}
	}
	if in.RevisesID != "" {
		old, err := scanConsultation(a.DB.QueryRowContext(r.Context(), "SELECT "+consultationColumns+" FROM consultations WHERE id=$1 AND client_id=$2 AND organization_id=$3", in.RevisesID, id, userFrom(r).OrganizationID))
		if err != nil {
			problem(w, 404, "consultation not found")
			return
		}
		c.SeriesID = old.SeriesID
		c.Revision = old.Revision + 1
		c.Template = old.Template
		if in.TemplateID != "" {
			problem(w, 400, "a revision preserves the original intake template")
			return
		}
	} else if in.TemplateID != "" {
		t, err := a.loadTemplate(r, in.TemplateID)
		if err != nil || t.Archived {
			problem(w, 404, "active template not found")
			return
		}
		if t.Version != in.TemplateVersion {
			problem(w, 409, "template changed; reload before starting intake")
			return
		}
		c.Template = &t
	}
	allowed := map[string]bool{}
	if c.Template != nil {
		for _, q := range c.Template.Questions {
			allowed[q.ID] = true
			answer := strings.TrimSpace(c.Answers[q.ID])
			if q.Required && answer == "" {
				problem(w, 400, "required intake answer is missing: "+q.Label)
				return
			}
			c.Answers[q.ID] = answer
		}
	}
	for k, v := range c.Answers {
		if !allowed[k] || len(v) > 4000 {
			problem(w, 400, "invalid intake answer")
			return
		}
	}
	// Insert only when the requested predecessor is still the latest revision. This
	// prevents concurrent edits from silently overwriting or branching its history.
	result, err := a.DB.ExecContext(r.Context(), "INSERT INTO consultations(id,organization_id,client_id,series_id,revision,title,fields,template_snapshot,answers,created_by,created_at) SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11 WHERE NOT EXISTS(SELECT 1 FROM consultations WHERE series_id=$4 AND revision >= $5)", c.ID, userFrom(r).OrganizationID, id, c.SeriesID, c.Revision, c.Title, string(rawJSON(c.Fields)), string(rawJSON(c.Template)), string(rawJSON(c.Answers)), c.CreatedBy, c.CreatedAt)
	if err != nil {
		problem(w, 500, "could not save consultation")
		return
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		problem(w, 409, "consultation changed; reload before revising")
		return
	}
	a.audit(r, "create revision", "consultation", c.ID)
	respond(w, 201, c)
}
