package app

import (
	"bytes"
	"crypto/sha256"
	"database/sql"
	"net/http"
	"strings"
	"time"
)

type OutcomeVisit struct {
	ID               string                       `json:"id"`
	ClientID         string                       `json:"clientId"`
	ConsultationID   string                       `json:"consultationId"`
	PreviousVisitID  string                       `json:"previousVisitId"`
	Kind             string                       `json:"kind"`
	Title            string                       `json:"title"`
	OccurredOn       string                       `json:"occurredOn"`
	Notes            string                       `json:"notes"`
	ClientFeedback   string                       `json:"clientFeedback"`
	Synthetic        bool                         `json:"synthetic"`
	BaselineSetID    string                       `json:"baselineSetId"`
	ActualSetID      string                       `json:"actualSetId"`
	ExpectedOptionID string                       `json:"expectedOptionId"`
	ExpectedEventID  string                       `json:"expectedEventId"`
	ExpectedVersion  int                          `json:"expectedVersion"`
	Views            map[string]map[string]string `json:"views"`
	CreatedAt        time.Time                    `json:"createdAt"`
}

const outcomeColumns = `id,client_id,consultation_id,COALESCE(previous_visit_id,''),kind,title,occurred_on,notes,client_feedback,synthetic,COALESCE(baseline_set_id,''),COALESCE(actual_set_id,''),COALESCE(expected_option_id,''),COALESCE(expected_event_id,''),expected_version,created_at`

func scanOutcome(row interface{ Scan(...any) error }) (OutcomeVisit, error) {
	var x OutcomeVisit
	err := row.Scan(&x.ID, &x.ClientID, &x.ConsultationID, &x.PreviousVisitID, &x.Kind, &x.Title, &x.OccurredOn, &x.Notes, &x.ClientFeedback, &x.Synthetic, &x.BaselineSetID, &x.ActualSetID, &x.ExpectedOptionID, &x.ExpectedEventID, &x.ExpectedVersion, &x.CreatedAt)
	x.Views = map[string]map[string]string{"baseline": {}, "actual": {}}
	return x, err
}

func (a *App) outcomeViews(r *http.Request, x *OutcomeVisit) error {
	rows, err := a.DB.QueryContext(r.Context(), `SELECT v.phase,v.view,v.asset_id FROM outcome_visit_views v JOIN assets a ON a.id=v.asset_id JOIN client_permissions p ON p.client_id=a.client_id AND p.withdrawn_at IS NULL WHERE v.visit_id=$1 AND a.client_id=$2 AND a.organization_id=$3`, x.ID, x.ClientID, userFrom(r).OrganizationID)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var phase, view, id string
		if err = rows.Scan(&phase, &view, &id); err != nil {
			return err
		}
		x.Views[phase][view] = id
	}
	return rows.Err()
}

func (a *App) listOutcomeVisits(w http.ResponseWriter, r *http.Request) {
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
	rows, err := a.DB.QueryContext(r.Context(), `SELECT `+outcomeColumns+` FROM outcome_visits WHERE client_id=$1 AND organization_id=$2 ORDER BY occurred_on DESC,created_at DESC`, client, userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load outcome visits")
		return
	}
	items := []OutcomeVisit{}
	for rows.Next() {
		x, e := scanOutcome(rows)
		if e != nil {
			rows.Close()
			problem(w, 500, "could not load outcome visits")
			return
		}
		items = append(items, x)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		problem(w, 500, "could not load outcome visits")
		return
	}
	for i := range items {
		if a.outcomeViews(r, &items[i]) != nil {
			problem(w, 500, "could not load retained outcome views")
			return
		}
	}
	respond(w, 200, items)
}

type outcomeInput struct {
	ConsultationID  string `json:"consultationId"`
	PreviousVisitID string `json:"previousVisitId"`
	Kind            string `json:"kind"`
	Title           string `json:"title"`
	OccurredOn      string `json:"occurredOn"`
	Notes           string `json:"notes"`
	ClientFeedback  string `json:"clientFeedback"`
	Synthetic       bool   `json:"synthetic"`
	ActualConfirmed bool   `json:"actualConfirmed"`
	BaselineSetID   string `json:"baselineSetId"`
	ActualSetID     string `json:"actualSetId"`
	ExpectedVersion *int   `json:"expectedVersion"`
	RequestID       string `json:"requestId"`
}

// These assignments are a snapshot. Later replacements change the photo set,
// while deleting source media cascades into this snapshot and never copies it.
func (a *App) retainedOutcomePhotos(r *http.Request, set string) (map[string]string, error) {
	if !a.photoSetExists(r, set, r.PathValue("clientID")) {
		return nil, sql.ErrNoRows
	}
	rows, err := a.DB.QueryContext(r.Context(), `SELECT v.view,v.asset_id FROM photo_views v JOIN assets a ON a.id=v.asset_id WHERE v.set_id=$1 AND a.client_id=$2 AND a.organization_id=$3 AND a.kind='source'`, set, r.PathValue("clientID"), userFrom(r).OrganizationID)
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

func (a *App) createOutcomeVisit(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	if !a.authorizeDemoClient(w, r) {
		return
	}
	client := r.PathValue("clientID")
	var in outcomeInput
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Title = strings.TrimSpace(in.Title)
	in.Notes = strings.TrimSpace(in.Notes)
	in.ClientFeedback = strings.TrimSpace(in.ClientFeedback)
	date, e := time.Parse("2006-01-02", in.OccurredOn)
	if (in.Kind != "post-cut" && in.Kind != "follow-up") || len(in.Title) < 2 || len(in.Title) > 160 || len(in.Notes) > 4000 || len(in.ClientFeedback) > 2000 || e != nil || date.After(now().Add(24*time.Hour)) || in.ExpectedVersion == nil || *in.ExpectedVersion < 0 || len(in.RequestID) < 16 || !nativeStyleID.MatchString(in.RequestID) {
		problem(w, 400, "visit type, title, past or current date, expected selection version and request ID are required")
		return
	}
	if !in.Synthetic && !in.ActualConfirmed {
		problem(w, 400, "confirm actual visit photographs or label the outcome synthetic")
		return
	}
	hash := sha256.Sum256(rawJSON(in))
	var existing string
	var oldHash []byte
	err = a.DB.QueryRowContext(r.Context(), "SELECT id,request_hash FROM outcome_visits WHERE client_id=$1 AND organization_id=$2 AND request_id=$3", client, userFrom(r).OrganizationID, in.RequestID).Scan(&existing, &oldHash)
	if err == nil {
		if !bytes.Equal(hash[:], oldHash) {
			problem(w, 409, "visit request already retained with different details")
			return
		}
		x, e := scanOutcome(a.DB.QueryRowContext(r.Context(), `SELECT `+outcomeColumns+` FROM outcome_visits WHERE id=$1`, existing))
		if e != nil || a.outcomeViews(r, &x) != nil {
			problem(w, 500, "could not reopen retained visit")
			return
		}
		respond(w, 200, x)
		return
	} else if err != sql.ErrNoRows {
		problem(w, 500, "could not check retained visit")
		return
	}
	var found string
	if a.DB.QueryRowContext(r.Context(), "SELECT id FROM consultations WHERE id=$1 AND client_id=$2 AND organization_id=$3", in.ConsultationID, client, userFrom(r).OrganizationID).Scan(&found) != nil {
		problem(w, 404, "consultation not found")
		return
	}
	if in.PreviousVisitID != "" {
		var previousDate string
		if a.DB.QueryRowContext(r.Context(), "SELECT occurred_on FROM outcome_visits WHERE id=$1 AND client_id=$2 AND organization_id=$3", in.PreviousVisitID, client, userFrom(r).OrganizationID).Scan(&previousDate) != nil {
			problem(w, 404, "previous visit not found")
			return
		}
		if in.Kind != "follow-up" || in.OccurredOn < previousDate {
			problem(w, 400, "a follow-up cannot precede its linked visit")
			return
		}
	}
	if in.BaselineSetID == in.ActualSetID {
		problem(w, 400, "choose separate baseline and actual photo sets")
		return
	}
	baseline, e := a.retainedOutcomePhotos(r, in.BaselineSetID)
	if e != nil {
		problem(w, 404, "baseline photo set not found")
		return
	}
	actual, e := a.retainedOutcomePhotos(r, in.ActualSetID)
	if e != nil {
		problem(w, 404, "actual photo set not found")
		return
	}
	if len(baseline) == 0 || len(actual) == 0 {
		problem(w, 400, "retain at least one labeled baseline and actual photo before recording a visit")
		return
	}
	var option, event string
	var version int
	err = a.DB.QueryRowContext(r.Context(), "SELECT COALESCE(option_id,''),version FROM expected_selections WHERE consultation_id=$1", in.ConsultationID).Scan(&option, &version)
	if err != nil && err != sql.ErrNoRows {
		problem(w, 500, "could not read expected selection")
		return
	}
	if version != *in.ExpectedVersion {
		problem(w, 409, "expected result changed; reload before recording the visit")
		return
	}
	if option != "" {
		x, e := a.ownedOption(r, option)
		if e != nil {
			problem(w, 409, "selected expected result is no longer available")
			return
		}
		if msg := a.expectedEligible(r, &x.State); msg != "" {
			problem(w, 409, msg)
			return
		}
		if a.DB.QueryRowContext(r.Context(), "SELECT id FROM expected_selection_events WHERE consultation_id=$1 AND sequence=$2 AND action='select' AND option_id=$3", in.ConsultationID, version, option).Scan(&event) != nil {
			problem(w, 409, "selected expected agreement is no longer available")
			return
		}
	}
	x := OutcomeVisit{ID: newID(), ClientID: client, ConsultationID: in.ConsultationID, PreviousVisitID: in.PreviousVisitID, Kind: in.Kind, Title: in.Title, OccurredOn: in.OccurredOn, Notes: in.Notes, ClientFeedback: in.ClientFeedback, Synthetic: in.Synthetic, BaselineSetID: in.BaselineSetID, ActualSetID: in.ActualSetID, ExpectedOptionID: option, ExpectedEventID: event, ExpectedVersion: version, Views: map[string]map[string]string{"baseline": baseline, "actual": actual}, CreatedAt: now()}
	tx, err := a.DB.BeginTx(r.Context(), nil)
	if err != nil {
		problem(w, 500, "could not record outcome visit")
		return
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(r.Context(), `INSERT INTO outcome_visits(id,organization_id,client_id,consultation_id,previous_visit_id,kind,title,occurred_on,notes,client_feedback,synthetic,baseline_set_id,actual_set_id,expected_option_id,expected_event_id,expected_version,request_id,request_hash,created_by,created_at) VALUES($1,$2,$3,$4,NULLIF($5,''),$6,$7,$8,$9,$10,$11,$12,$13,NULLIF($14,''),NULLIF($15,''),$16,$17,$18,$19,$20)`, x.ID, userFrom(r).OrganizationID, client, x.ConsultationID, x.PreviousVisitID, x.Kind, x.Title, x.OccurredOn, x.Notes, x.ClientFeedback, x.Synthetic, x.BaselineSetID, x.ActualSetID, x.ExpectedOptionID, x.ExpectedEventID, x.ExpectedVersion, in.RequestID, hash[:], userFrom(r).ID, x.CreatedAt)
	for phase, views := range x.Views {
		for view, id := range views {
			if err == nil {
				_, err = tx.ExecContext(r.Context(), "INSERT INTO outcome_visit_views(visit_id,phase,view,asset_id) VALUES($1,$2,$3,$4)", x.ID, phase, view, id)
			}
		}
	}
	if err != nil {
		problem(w, 500, "could not record retained outcome views")
		return
	}
	if tx.Commit() != nil {
		problem(w, 500, "could not record outcome visit")
		return
	}
	respond(w, 201, x)
}
