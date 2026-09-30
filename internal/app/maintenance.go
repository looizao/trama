package app

import (
	"bytes"
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

type MaintenanceGuidance struct {
	DailyMinutes int      `json:"dailyMinutes"`
	Washing      string   `json:"washing"`
	HairSteps    []string `json:"hairSteps"`
	BeardSteps   []string `json:"beardSteps"`
	Products     []string `json:"products"`
	TrimDays     int      `json:"trimDays"`
	CheckInDays  int      `json:"checkInDays"`
	Feasibility  string   `json:"feasibility"`
}
type GrowthStage struct {
	Position       int    `json:"position"`
	Weeks          int    `json:"weeks"`
	Title          string `json:"title"`
	Instructions   string `json:"instructions"`
	OptionID       string `json:"optionId"`
	OutcomeVisitID string `json:"outcomeVisitId"`
}
type MaintenancePlan struct {
	ID               string              `json:"id"`
	ClientID         string              `json:"clientId"`
	ConsultationID   string              `json:"consultationId"`
	SeriesID         string              `json:"seriesId"`
	Revision         int                 `json:"revision"`
	ParentID         string              `json:"parentId"`
	Title            string              `json:"title"`
	StartsOn         string              `json:"startsOn"`
	Guidance         MaintenanceGuidance `json:"guidance"`
	Synthetic        bool                `json:"synthetic"`
	ExpectedOptionID string              `json:"expectedOptionId"`
	ExpectedEventID  string              `json:"expectedEventId"`
	ExpectedVersion  int                 `json:"expectedVersion"`
	CreatedAt        time.Time           `json:"createdAt"`
	Stages           []GrowthStage       `json:"stages"`
}

const maintenanceColumns = "id,client_id,consultation_id,series_id,revision,COALESCE(parent_id,''),title,starts_on,guidance,synthetic,COALESCE(expected_option_id,''),COALESCE(expected_event_id,''),expected_version,created_at"

func scanMaintenance(row interface{ Scan(...any) error }) (MaintenancePlan, error) {
	var x MaintenancePlan
	var raw string
	err := row.Scan(&x.ID, &x.ClientID, &x.ConsultationID, &x.SeriesID, &x.Revision, &x.ParentID, &x.Title, &x.StartsOn, &raw, &x.Synthetic, &x.ExpectedOptionID, &x.ExpectedEventID, &x.ExpectedVersion, &x.CreatedAt)
	if err == nil {
		err = json.Unmarshal([]byte(raw), &x.Guidance)
	}
	x.Stages = []GrowthStage{}
	return x, err
}
func (a *App) maintenanceStages(r *http.Request, x *MaintenancePlan) error {
	rows, err := a.DB.QueryContext(r.Context(), "SELECT position,weeks,title,instructions,COALESCE(option_id,''),COALESCE(outcome_visit_id,'') FROM growth_plan_stages WHERE plan_id=$1 ORDER BY position", x.ID)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var s GrowthStage
		if err = rows.Scan(&s.Position, &s.Weeks, &s.Title, &s.Instructions, &s.OptionID, &s.OutcomeVisitID); err != nil {
			return err
		}
		x.Stages = append(x.Stages, s)
	}
	return rows.Err()
}
func (a *App) listMaintenancePlans(w http.ResponseWriter, r *http.Request) {
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
	rows, err := a.DB.QueryContext(r.Context(), "SELECT "+maintenanceColumns+" FROM maintenance_plans WHERE client_id=$1 AND organization_id=$2 ORDER BY created_at DESC,revision DESC", r.PathValue("clientID"), userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load plans")
		return
	}
	items := []MaintenancePlan{}
	for rows.Next() {
		x, e := scanMaintenance(rows)
		if e != nil {
			rows.Close()
			problem(w, 500, "could not load plans")
			return
		}
		items = append(items, x)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		problem(w, 500, "could not load plans")
		return
	}
	for i := range items {
		if a.maintenanceStages(r, &items[i]) != nil {
			problem(w, 500, "could not load plan stages")
			return
		}
	}
	respond(w, 200, items)
}
func validateMaintenance(g *MaintenanceGuidance) bool {
	g.Washing = strings.TrimSpace(g.Washing)
	g.Feasibility = strings.TrimSpace(g.Feasibility)
	if g.DailyMinutes < 0 || g.DailyMinutes > 120 || len(g.Washing) < 2 || len(g.Washing) > 2000 || len(g.Feasibility) < 5 || len(g.Feasibility) > 4000 || g.TrimDays < 1 || g.TrimDays > 365 || g.CheckInDays < 1 || g.CheckInDays > 365 {
		return false
	}
	for _, steps := range []*[]string{&g.HairSteps, &g.BeardSteps, &g.Products} {
		if len(*steps) > 12 {
			return false
		}
		if *steps == nil {
			*steps = []string{}
		}
		for i := range *steps {
			(*steps)[i] = strings.TrimSpace((*steps)[i])
			if len((*steps)[i]) < 2 || len((*steps)[i]) > 1000 {
				return false
			}
		}
	}
	return len(g.HairSteps) > 0
}
func (a *App) saveMaintenancePlan(w http.ResponseWriter, r *http.Request) {
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
		ConsultationID       string              `json:"consultationId"`
		ParentID             string              `json:"parentId"`
		Title                string              `json:"title"`
		StartsOn             string              `json:"startsOn"`
		Guidance             MaintenanceGuidance `json:"guidance"`
		Stages               []GrowthStage       `json:"stages"`
		ExpectedVersion      *int                `json:"expectedVersion"`
		Synthetic            bool                `json:"synthetic"`
		ProfessionalReviewed bool                `json:"professionalReviewed"`
		RequestID            string              `json:"requestId"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Title = strings.TrimSpace(in.Title)
	_, dateErr := time.Parse("2006-01-02", in.StartsOn)
	if len(in.Title) < 2 || len(in.Title) > 160 || dateErr != nil || !validateMaintenance(&in.Guidance) || len(in.Stages) < 1 || len(in.Stages) > 8 || in.ExpectedVersion == nil || *in.ExpectedVersion < 1 || len(in.RequestID) < 16 || !nativeStyleID.MatchString(in.RequestID) {
		problem(w, 400, "plan needs title, start date, selected expected version, guidance, 1–8 stages and request ID")
		return
	}
	if !in.Synthetic && !in.ProfessionalReviewed {
		problem(w, 400, "record professional feasibility review or label the plan synthetic")
		return
	}
	client := r.PathValue("clientID")
	x := MaintenancePlan{ID: newID(), ClientID: client, ConsultationID: in.ConsultationID, Title: in.Title, StartsOn: in.StartsOn, Guidance: in.Guidance, Synthetic: in.Synthetic, ParentID: in.ParentID, Revision: 1, Stages: in.Stages, CreatedAt: now()}
	x.SeriesID = x.ID
	hash := sha256.Sum256(rawJSON(in))
	var oldHash []byte
	var existing string
	err = a.DB.QueryRowContext(r.Context(), "SELECT id,request_hash FROM maintenance_plans WHERE client_id=$1 AND request_id=$2", client, in.RequestID).Scan(&existing, &oldHash)
	if err == nil {
		if !bytes.Equal(oldHash, hash[:]) {
			problem(w, 409, "plan request already retained with different details")
			return
		}
		old, e := scanMaintenance(a.DB.QueryRowContext(r.Context(), "SELECT "+maintenanceColumns+" FROM maintenance_plans WHERE id=$1", existing))
		if e != nil || a.maintenanceStages(r, &old) != nil {
			problem(w, 500, "could not reopen plan")
			return
		}
		respond(w, 200, old)
		return
	} else if err != sql.ErrNoRows {
		problem(w, 500, "could not check plan request")
		return
	}
	var found string
	if a.DB.QueryRowContext(r.Context(), "SELECT id FROM consultations WHERE id=$1 AND client_id=$2 AND organization_id=$3", in.ConsultationID, client, userFrom(r).OrganizationID).Scan(&found) != nil {
		problem(w, 404, "consultation not found")
		return
	}
	if x.ParentID != "" {
		old, e := scanMaintenance(a.DB.QueryRowContext(r.Context(), "SELECT "+maintenanceColumns+" FROM maintenance_plans WHERE id=$1 AND client_id=$2 AND consultation_id=$3", x.ParentID, client, in.ConsultationID))
		if e != nil {
			problem(w, 404, "previous plan not found")
			return
		}
		x.SeriesID = old.SeriesID
		x.Revision = old.Revision + 1
		var latest int
		if a.DB.QueryRowContext(r.Context(), "SELECT MAX(revision) FROM maintenance_plans WHERE series_id=$1", x.SeriesID).Scan(&latest) != nil || latest != old.Revision {
			problem(w, 409, "plan changed; revise the latest version")
			return
		}
	}
	if a.DB.QueryRowContext(r.Context(), "SELECT COALESCE(option_id,''),version FROM expected_selections WHERE consultation_id=$1", in.ConsultationID).Scan(&x.ExpectedOptionID, &x.ExpectedVersion) != nil || x.ExpectedOptionID == "" || x.ExpectedVersion != *in.ExpectedVersion {
		problem(w, 409, "expected result changed or unavailable; reload before planning")
		return
	}
	var agreementMethod string
	if a.DB.QueryRowContext(r.Context(), "SELECT id,agreement_method FROM expected_selection_events WHERE consultation_id=$1 AND sequence=$2 AND action='select' AND option_id=$3", in.ConsultationID, x.ExpectedVersion, x.ExpectedOptionID).Scan(&x.ExpectedEventID, &agreementMethod) != nil {
		problem(w, 409, "expected agreement unavailable")
		return
	}
	if agreementMethod == "synthetic-demonstration" && !x.Synthetic {
		problem(w, 400, "a synthetic expected result requires a synthetic plan label")
		return
	}
	ids := map[string]bool{x.ExpectedOptionID: true}
	lastWeeks := -1
	for i := range x.Stages {
		s := &x.Stages[i]
		s.Position = i + 1
		s.Title = strings.TrimSpace(s.Title)
		s.Instructions = strings.TrimSpace(s.Instructions)
		if s.Weeks < 0 || s.Weeks > 104 || s.Weeks < lastWeeks || (i == 0 && s.Weeks != 0) || len(s.Title) < 2 || len(s.Title) > 160 || len(s.Instructions) < 5 || len(s.Instructions) > 2000 || s.OptionID == "" {
			problem(w, 400, "stages need ordered weeks starting at zero, title, guidance and a retained native option")
			return
		}
		lastWeeks = s.Weeks
		ids[s.OptionID] = true
		if s.OutcomeVisitID != "" {
			if a.DB.QueryRowContext(r.Context(), "SELECT id FROM outcome_visits WHERE id=$1 AND client_id=$2 AND organization_id=$3", s.OutcomeVisitID, client, userFrom(r).OrganizationID).Scan(&found) != nil {
				problem(w, 404, "outcome visit not found")
				return
			}
		}
	}
	for id := range ids {
		option, e := a.ownedOption(r, id)
		if e != nil {
			problem(w, 404, "stage option not found")
			return
		}
		if msg := a.expectedEligible(r, &option.State); msg != "" {
			problem(w, 409, msg)
			return
		}
	}
	tx, err := a.DB.BeginTx(r.Context(), nil)
	if err != nil {
		problem(w, 500, "could not retain plan")
		return
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(r.Context(), `INSERT INTO maintenance_plans(id,organization_id,client_id,consultation_id,series_id,revision,parent_id,title,starts_on,guidance,synthetic,expected_option_id,expected_event_id,expected_version,request_id,request_hash,created_by,created_at) VALUES($1,$2,$3,$4,$5,$6,NULLIF($7,''),$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`, x.ID, userFrom(r).OrganizationID, client, x.ConsultationID, x.SeriesID, x.Revision, x.ParentID, x.Title, x.StartsOn, string(rawJSON(x.Guidance)), x.Synthetic, x.ExpectedOptionID, x.ExpectedEventID, x.ExpectedVersion, in.RequestID, hash[:], userFrom(r).ID, x.CreatedAt)
	for _, s := range x.Stages {
		if err == nil {
			_, err = tx.ExecContext(r.Context(), "INSERT INTO growth_plan_stages(plan_id,position,weeks,title,instructions,option_id,outcome_visit_id) VALUES($1,$2,$3,$4,$5,$6,NULLIF($7,''))", x.ID, s.Position, s.Weeks, s.Title, s.Instructions, s.OptionID, s.OutcomeVisitID)
		}
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		problem(w, 500, "could not retain plan")
		return
	}
	a.audit(r, "retain plan revision", "maintenance plan", x.ID)
	respond(w, 201, x)
}
