package app

import (
	"bytes"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	"image/jpeg"
	"net/http"
	"strings"
	"time"
)

func optionPreviewURL(client, option string) string {
	return "/api/clients/" + client + "/demo-options/" + option + "/preview"
}
func decodeOptionPicture(value string) ([]byte, error) {
	if value == "" {
		return nil, nil
	}
	if len(value) > 700000 || !strings.HasPrefix(value, "data:image/jpeg;base64,") {
		return nil, fmt.Errorf("preview must be a JPEG picture under 500 KB")
	}
	b, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(value, "data:image/jpeg;base64,"))
	if err != nil || len(b) > 500000 {
		return nil, fmt.Errorf("invalid preview picture")
	}
	config, format, err := image.DecodeConfig(bytes.NewReader(b))
	if err != nil || format != "jpeg" || config.Width < 16 || config.Height < 16 || config.Width > 1024 || config.Height > 1024 {
		return nil, fmt.Errorf("preview picture must be 16 to 1024 pixels per side")
	}
	im, _, err := image.Decode(bytes.NewReader(b))
	if err != nil {
		return nil, fmt.Errorf("invalid preview picture")
	}
	var out bytes.Buffer
	err = jpeg.Encode(&out, im, &jpeg.Options{Quality: 85})
	return out.Bytes(), err
}
func (a *App) ownedOption(r *http.Request, id string) (DemoOption, error) {
	var x DemoOption
	var raw string
	err := a.DB.QueryRowContext(r.Context(), "SELECT id,title,candidate,state,created_at FROM demo_options WHERE id=$1 AND client_id=$2 AND organization_id=$3", id, r.PathValue("clientID"), userFrom(r).OrganizationID).Scan(&x.ID, &x.Title, &x.Candidate, &raw, &x.CreatedAt)
	if err == nil {
		err = json.Unmarshal([]byte(raw), &x.State)
	}
	return x, err
}
func (a *App) optionPreview(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	if !a.authorizeDemoClient(w, r) {
		return
	}
	x, err := a.ownedOption(r, r.PathValue("optionID"))
	if err != nil {
		problem(w, 404, "option not found")
		return
	}
	if msg := a.validateDemoState(r, &x.State); msg != "" {
		problem(w, 404, "saved sources are no longer available")
		return
	}
	var b []byte
	if err = a.DB.QueryRowContext(r.Context(), "SELECT picture FROM demo_option_previews WHERE option_id=$1", x.ID).Scan(&b); err != nil {
		problem(w, 404, "retained picture not found")
		return
	}
	w.Header().Set("Content-Type", "image/jpeg")
	w.Header().Set("Cache-Control", "private, no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Write(b)
}
func (a *App) retainOptionPreview(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	if !a.authorizeDemoClient(w, r) {
		return
	}
	x, err := a.ownedOption(r, r.PathValue("optionID"))
	if err != nil {
		problem(w, 404, "option not found")
		return
	}
	var in struct {
		Preview string             `json:"preview"`
		State   DemoWorkspaceState `json:"state"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	if msg := a.validateDemoState(r, &in.State); msg != "" {
		problem(w, 400, msg)
		return
	}
	// Canonical typed states, not untrusted JSON property order. Picture is an
	// illustrative browser render; native geometry remains the authoritative option.
	if !bytes.Equal(rawJSON(x.State), rawJSON(in.State)) {
		problem(w, 409, "reopen the exact option before retaining its picture")
		return
	}
	picture, err := decodeOptionPicture(in.Preview)
	if err != nil || len(picture) == 0 {
		problem(w, 400, "valid preview picture is required")
		return
	}
	result, err := a.DB.ExecContext(r.Context(), "INSERT OR IGNORE INTO demo_option_previews(option_id,picture,created_at) VALUES($1,$2,$3)", x.ID, picture, now())
	if err != nil {
		problem(w, 500, "could not retain preview")
		return
	}
	n, _ := result.RowsAffected()
	if n != 1 {
		problem(w, 409, "option picture already retained")
		return
	}
	respond(w, 201, map[string]string{"previewUrl": optionPreviewURL(r.PathValue("clientID"), x.ID)})
}

type ExpectedEvent struct {
	ID              string    `json:"id"`
	OptionID        string    `json:"optionId"`
	Sequence        int       `json:"sequence"`
	Action          string    `json:"action"`
	Rationale       string    `json:"rationale"`
	AgreementMethod string    `json:"agreementMethod"`
	AgreementName   string    `json:"agreementName"`
	CreatedBy       string    `json:"createdBy"`
	CreatedAt       time.Time `json:"createdAt"`
}
type ExpectedResult struct {
	ConsultationID string          `json:"consultationId"`
	OptionID       string          `json:"optionId"`
	Version        int             `json:"version"`
	History        []ExpectedEvent `json:"history"`
}

func (a *App) listExpectedResults(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	if !a.authorizeDemoClient(w, r) {
		return
	}
	rows, err := a.DB.QueryContext(r.Context(), `SELECT c.id,COALESCE(s.option_id,''),COALESCE(s.version,0) FROM consultations c LEFT JOIN expected_selections s ON s.consultation_id=c.id WHERE c.client_id=$1 AND c.organization_id=$2 ORDER BY c.created_at DESC`, r.PathValue("clientID"), userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load expected results")
		return
	}
	items := []ExpectedResult{}
	for rows.Next() {
		var x ExpectedResult
		if err = rows.Scan(&x.ConsultationID, &x.OptionID, &x.Version); err != nil {
			rows.Close()
			problem(w, 500, "could not load expected results")
			return
		}
		x.History = []ExpectedEvent{}
		items = append(items, x)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		problem(w, 500, "could not load expected results")
		return
	}
	for i := range items {
		events, e := a.DB.QueryContext(r.Context(), `SELECT id,COALESCE(option_id,''),sequence,action,rationale,agreement_method,agreement_name,created_by,created_at FROM expected_selection_events WHERE consultation_id=$1 ORDER BY sequence DESC`, items[i].ConsultationID)
		if e != nil {
			problem(w, 500, "could not load selection history")
			return
		}
		for events.Next() {
			var x ExpectedEvent
			if e = events.Scan(&x.ID, &x.OptionID, &x.Sequence, &x.Action, &x.Rationale, &x.AgreementMethod, &x.AgreementName, &x.CreatedBy, &x.CreatedAt); e != nil {
				break
			}
			items[i].History = append(items[i].History, x)
		}
		if e == nil {
			e = events.Err()
		}
		events.Close()
		if e != nil {
			problem(w, 500, "could not load selection history")
			return
		}
	}
	respond(w, 200, items)
}
func (a *App) expectedEligible(r *http.Request, state *DemoWorkspaceState) string {
	if state.ModelRunID == "" {
		return "a completed client-specific head is required for an expected result"
	}
	if msg := a.validateDemoState(r, state); msg != "" {
		return msg
	}
	for _, v := range requiredPhotoViews {
		if state.PhotoViews[v] == "" {
			return "six labeled source views are required before selecting an expected result"
		}
	}
	if state.Refinement != nil && state.Refinement.Version != "style-mesh-v2" {
		return "upgrade the historical style attachment before selecting an expected result"
	}
	rows, err := a.DB.QueryContext(r.Context(), `WITH RECURSIVE models(id) AS (
 SELECT $1 UNION SELECT d.source_run_id FROM demo_job_dependencies d JOIN models m ON d.run_id=m.id)
 SELECT j.candidate,j.result FROM models m JOIN demo_jobs j ON j.run_id=m.id`, state.ModelRunID)
	if err != nil {
		return "native result is unavailable"
	}
	defer rows.Close()
	versions := map[string]string{"blender-mpfb": "mpfb-metre-z-up-v2", "makehuman": "makehuman-metre-z-up-v2", "flame": "flame-2023-open-neutral-rig-v4"}
	components := map[string]string{"open3d": "open3d-cpu-upstream-v5", "meshlab": "meshlab-native-upstream-v1", "cloudcompare": "cloudcompare-native-upstream-v2"}
	count := 0
	for rows.Next() {
		var candidate, raw string
		if rows.Scan(&candidate, &raw) != nil {
			return "invalid native result"
		}
		var result struct {
			Fit struct {
				Basis string `json:"basisVersion"`
			} `json:"fit"`
			Component struct {
				Version string `json:"processingVersion"`
			} `json:"component"`
		}
		if json.Unmarshal([]byte(raw), &result) != nil {
			return "invalid native result"
		}
		if expected := versions[candidate]; expected != "" && result.Fit.Basis != expected {
			return "historical native fit has known limitations; use a corrected experiment"
		}
		if expected := components[candidate]; expected != "" && result.Component.Version != expected {
			return "historical supporting output has known limitations; use a corrected experiment"
		}
		count++
	}
	if rows.Err() != nil || count == 0 {
		return "native result is unavailable"
	}
	return ""
}
func (a *App) selectExpectedResult(w http.ResponseWriter, r *http.Request) {
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
		ConsultationID       string `json:"consultationId"`
		OptionID             string `json:"optionId"`
		Version              int    `json:"version"`
		Rationale            string `json:"rationale"`
		AgreementMethod      string `json:"agreementMethod"`
		AgreementName        string `json:"agreementName"`
		ProfessionalReviewed bool   `json:"professionalReviewed"`
		ClientAgreed         bool   `json:"clientAgreed"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	var consultation, name string
	if a.DB.QueryRowContext(r.Context(), `SELECT c.id,cl.name FROM consultations c JOIN clients cl ON cl.id=c.client_id WHERE c.id=$1 AND c.client_id=$2 AND c.organization_id=$3`, in.ConsultationID, r.PathValue("clientID"), userFrom(r).OrganizationID).Scan(&consultation, &name) != nil {
		problem(w, 404, "consultation not found")
		return
	}
	in.Rationale = strings.TrimSpace(in.Rationale)
	if len(in.Rationale) < 5 || len(in.Rationale) > 2000 {
		problem(w, 400, "record a rationale of 5 to 2000 characters")
		return
	}
	action := "clear"
	if in.OptionID != "" {
		x, e := a.ownedOption(r, in.OptionID)
		if e != nil {
			problem(w, 404, "option not found")
			return
		}
		if msg := a.expectedEligible(r, &x.State); msg != "" {
			problem(w, 400, msg)
			return
		}
		if !in.ProfessionalReviewed || !in.ClientAgreed || strings.TrimSpace(in.AgreementName) != name || (in.AgreementMethod != "professional-recorded" && in.AgreementMethod != "synthetic-demonstration") {
			problem(w, 400, "record professional review, client agreement, matching client name and agreement method")
			return
		}
		action = "select"
	} else {
		in.AgreementMethod = ""
		in.AgreementName = ""
	}
	tx, err := a.DB.BeginTx(r.Context(), nil)
	if err != nil {
		problem(w, 500, "could not save selection")
		return
	}
	defer tx.Rollback()
	var version int
	err = tx.QueryRowContext(r.Context(), "SELECT version FROM expected_selections WHERE consultation_id=$1", consultation).Scan(&version)
	if err != nil && err != sql.ErrNoRows {
		problem(w, 500, "could not read selection version")
		return
	}
	if version != in.Version {
		problem(w, 409, "expected result changed; reload before selecting")
		return
	}
	event := ExpectedEvent{ID: newID(), OptionID: in.OptionID, Sequence: version + 1, Action: action, Rationale: in.Rationale, AgreementMethod: in.AgreementMethod, AgreementName: strings.TrimSpace(in.AgreementName), CreatedBy: userFrom(r).ID, CreatedAt: now()}
	_, err = tx.ExecContext(r.Context(), `INSERT INTO expected_selections(consultation_id,option_id,version) VALUES($1,NULLIF($2,''),$3) ON CONFLICT(consultation_id) DO UPDATE SET option_id=excluded.option_id,version=excluded.version`, consultation, event.OptionID, event.Sequence)
	if err == nil {
		_, err = tx.ExecContext(r.Context(), `INSERT INTO expected_selection_events(id,consultation_id,option_id,sequence,action,rationale,agreement_method,agreement_name,created_by,created_at) VALUES($1,$2,NULLIF($3,''),$4,$5,$6,$7,$8,$9,$10)`, event.ID, consultation, event.OptionID, event.Sequence, event.Action, event.Rationale, event.AgreementMethod, event.AgreementName, event.CreatedBy, event.CreatedAt)
	}
	if err != nil {
		problem(w, 500, "could not save selection history")
		return
	}
	if err = tx.Commit(); err != nil {
		problem(w, 500, "could not save selection")
		return
	}
	respond(w, 201, event)
}
