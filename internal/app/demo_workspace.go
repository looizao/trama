package app

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strings"
	"time"
)

type DemoCamera struct {
	Azimuth   float64 `json:"azimuth"`
	Elevation float64 `json:"elevation"`
	Distance  float64 `json:"distance"`
}
type DemoWorkspaceState struct {
	Candidate      string                `json:"candidate"`
	PhotoSetID     string                `json:"photoSetId"`
	PhotoViews     map[string]string     `json:"photoViews"`
	ModelRunID     string                `json:"modelRunId"`
	CurrentHairID  string                `json:"currentHairId"`
	CurrentBeardID string                `json:"currentBeardId"`
	HairID         string                `json:"hairId"`
	BeardID        string                `json:"beardId"`
	Camera         DemoCamera            `json:"camera"`
	MinimumWidth   int                   `json:"minimumWidth"`
	Native         NativeDemoSettings    `json:"native"`
	Component      ComponentDemoSettings `json:"component"`
	ColmapPreset   string                `json:"colmapPreset"`
	Refinement     *DemoRefinement       `json:"refinement,omitempty"`
	RevisionNote   string                `json:"revisionNote,omitempty"`
}
type DemoOption struct {
	ID        string             `json:"id"`
	Title     string             `json:"title"`
	Candidate string             `json:"candidate"`
	Geometry  string             `json:"geometry"`
	State     DemoWorkspaceState `json:"state"`
	CreatedAt time.Time          `json:"createdAt"`
}

func (a *App) validateDemoState(r *http.Request, state *DemoWorkspaceState) string {
	client := r.PathValue("clientID")
	if len(state.RevisionNote) > 2000 {
		return "revision note exceeds 2000 bytes"
	}
	if state.Refinement != nil {
		if state.ModelRunID == "" {
			return "refine a completed client head before saving"
		}
		if message := state.Refinement.validate(); message != "" {
			return message
		}
		defaults := defaultDemoRefinement()
		hairUnavailable := state.HairID == "none" || state.HairID == "keep-current"
		beardUnavailable := state.BeardID == "clean-shaven" || state.BeardID == "keep-current"
		if (hairUnavailable && state.Refinement.Hair != defaults.Hair) || (beardUnavailable && state.Refinement.Beard != defaults.Beard) {
			return "choose a proposed style before editing it"
		}
		for _, stroke := range state.Refinement.Strokes {
			if (stroke.Kind == "hair" && hairUnavailable) || (stroke.Kind == "beard" && beardUnavailable) {
				return "brush target style is absent or retained unchanged"
			}
		}
	}
	if state.ColmapPreset == "" {
		state.ColmapPreset = "standard"
	}
	if !validColmapPreset(state.ColmapPreset) {
		return "unsupported COLMAP preset"
	}
	if message := state.Native.defaultsAndValidate(); message != "" {
		return message
	}
	if !validDemoCandidate(state.Candidate) {
		return "select one of the eight demo candidates"
	}
	if state.PhotoSetID != "" && !a.photoSetExists(r, state.PhotoSetID, client) {
		return "photo set not found"
	}
	if state.PhotoSetID == "" && len(state.PhotoViews) > 0 {
		return "select the source photo set"
	}
	if state.PhotoSetID != "" {
		inputs, err := a.resolveDemoPhotoViews(r, state.PhotoSetID, state.PhotoViews)
		if err != nil {
			return err.Error()
		}
		state.PhotoViews = inputs
	}
	if state.Component != (ComponentDemoSettings{}) && state.Component.SourceRunID != "" {
		if message := state.Component.validate(); message != "" {
			return message
		}
		if !a.validateComponentSource(r, state.Component.SourceRunID, state.PhotoSetID, state.PhotoViews) {
			return "upstream source is no longer available"
		}
		if state.Component.ReferenceRunID != "" && (state.Candidate != "cloudcompare" || !a.validateComponentSource(r, state.Component.ReferenceRunID, state.PhotoSetID, state.PhotoViews)) {
			return "CloudCompare comparison reference is no longer available"
		}
	}
	// Personalized model selection becomes available only after a fitting route
	// publishes an actual model. Input reports cannot masquerade as 3D results.
	if state.ModelRunID != "" && !a.completedNativeModel(r, *state) {
		return "a completed fitting result is required"
	}
	if state.MinimumWidth < 64 || state.MinimumWidth > 4096 {
		return "minimum image width must be between 64 and 4096"
	}
	for _, v := range []float64{state.Camera.Azimuth, state.Camera.Elevation, state.Camera.Distance} {
		if math.IsNaN(v) || math.IsInf(v, 0) {
			return "invalid viewing camera"
		}
	}
	if math.Abs(state.Camera.Azimuth) > math.Pi*2 || math.Abs(state.Camera.Elevation) > 1.45 || state.Camera.Distance < .3 || state.Camera.Distance > 3 {
		return "viewing camera is outside supported bounds"
	}
	hair, err := readDemoStyles("hair")
	if err != nil {
		return "local demo asset library is unavailable"
	}
	beard, err := readDemoStyles("beard")
	if err != nil {
		return "local demo asset library is unavailable"
	}
	exists := func(id string, styles []DemoStyle, choices ...string) bool {
		for _, c := range choices {
			if id == c {
				return true
			}
		}
		for _, s := range styles {
			if s.ID == id {
				return true
			}
		}
		return false
	}
	if !exists(state.CurrentHairID, hair, "none") || !exists(state.HairID, hair, "none", "keep-current") || !exists(state.CurrentBeardID, beard, "clean-shaven") || !exists(state.BeardID, beard, "clean-shaven", "keep-current") {
		return "select compatible independent hair and beard assets"
	}
	return ""
}
func (a *App) authorizeDemoClient(w http.ResponseWriter, r *http.Request) bool {
	if !a.clientExists(r, r.PathValue("clientID")) {
		problem(w, 404, "client not found")
		return false
	}
	if !a.hasPermission(r.Context(), r.PathValue("clientID")) {
		problem(w, 403, "client acknowledgement is required before storing or processing media")
		return false
	}
	return true
}
func (a *App) getDemoWorkspace(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	if !a.authorizeDemoClient(w, r) {
		return
	}
	var raw string
	var version int
	err = a.DB.QueryRowContext(r.Context(), "SELECT state,version FROM demo_workspace_states WHERE client_id=$1", r.PathValue("clientID")).Scan(&raw, &version)
	if err == sql.ErrNoRows {
		respond(w, 200, map[string]any{"state": nil, "version": 0})
		return
	}
	if err != nil {
		problem(w, 500, "could not reopen demo workspace")
		return
	}
	respond(w, 200, map[string]any{"state": json.RawMessage(raw), "version": version})
}
func (a *App) saveDemoWorkspace(w http.ResponseWriter, r *http.Request) {
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
		State   DemoWorkspaceState `json:"state"`
		Version int                `json:"version"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	if message := a.validateDemoState(r, &in.State); message != "" {
		problem(w, 400, message)
		return
	}
	var result sql.Result
	if in.Version == 0 {
		result, err = a.DB.ExecContext(r.Context(), "INSERT OR IGNORE INTO demo_workspace_states(client_id,state,version) VALUES($1,$2,1)", r.PathValue("clientID"), string(rawJSON(in.State)))
	} else {
		result, err = a.DB.ExecContext(r.Context(), "UPDATE demo_workspace_states SET state=$1,version=version+1 WHERE client_id=$2 AND version=$3", string(rawJSON(in.State)), r.PathValue("clientID"), in.Version)
	}
	if err != nil {
		problem(w, 500, "could not save demo workspace")
		return
	}
	count, err := result.RowsAffected()
	if err != nil {
		problem(w, 500, "could not save demo workspace")
		return
	}
	if count != 1 {
		problem(w, 409, "workspace changed; reload before saving")
		return
	}
	respond(w, 200, map[string]any{"state": in.State, "version": in.Version + 1})
}
func (a *App) listDemoOptions(w http.ResponseWriter, r *http.Request) {
	unlock, guardErr := a.lockMedia()
	if guardErr != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	if !a.authorizeDemoClient(w, r) {
		return
	}
	rows, err := a.DB.QueryContext(r.Context(), "SELECT id,title,candidate,state,created_at FROM demo_options WHERE client_id=$1 AND organization_id=$2 ORDER BY created_at DESC", r.PathValue("clientID"), userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load explored asset options")
		return
	}
	defer rows.Close()
	items := []DemoOption{}
	for rows.Next() {
		var x DemoOption
		var raw string
		if err = rows.Scan(&x.ID, &x.Title, &x.Candidate, &raw, &x.CreatedAt); err != nil {
			problem(w, 500, "could not load explored asset options")
			return
		}
		if err = json.Unmarshal([]byte(raw), &x.State); err != nil {
			problem(w, 500, "invalid saved option")
			return
		}
		x.Geometry = nativeGeometry(x.State)
		items = append(items, x)
	}
	if rows.Err() != nil {
		problem(w, 500, "could not load explored asset options")
		return
	}
	respond(w, 200, items)
}
func (a *App) saveDemoOption(w http.ResponseWriter, r *http.Request) {
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
		Title string             `json:"title"`
		State DemoWorkspaceState `json:"state"`
	}
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	in.Title = strings.TrimSpace(in.Title)
	if len(in.Title) < 2 || len(in.Title) > 160 {
		problem(w, 400, "option title must have 2 to 160 characters")
		return
	}
	if message := a.validateDemoState(r, &in.State); message != "" {
		problem(w, 400, message)
		return
	}
	x := DemoOption{ID: newID(), Title: in.Title, Candidate: in.State.Candidate, Geometry: nativeGeometry(in.State), State: in.State, CreatedAt: now()}
	tx, err := a.DB.BeginTx(r.Context(), nil)
	if err != nil {
		problem(w, 500, "could not save explored asset option")
		return
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(r.Context(), "INSERT INTO demo_options(id,organization_id,client_id,candidate,title,state,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)", x.ID, userFrom(r).OrganizationID, r.PathValue("clientID"), x.Candidate, x.Title, string(rawJSON(x.State)), x.CreatedAt)
	if err == nil && x.State.PhotoSetID != "" {
		for _, id := range x.State.PhotoViews {
			if err == nil {
				_, err = tx.ExecContext(r.Context(), "INSERT OR IGNORE INTO demo_option_inputs(option_id,asset_id) VALUES($1,$2)", x.ID, id)
			}
		}
	}
	if err != nil {
		problem(w, 500, "could not save explored asset option")
		return
	}
	if err = tx.Commit(); err != nil {
		problem(w, 500, "could not save explored asset option")
		return
	}
	respond(w, 201, x)
}

// Saved explorations snapshot assignments, so later replacements do not rewrite
// history. Every retained source still requires ownership and active permission.
func (a *App) resolveDemoPhotoViews(r *http.Request, set string, snapshot map[string]string) (map[string]string, error) {
	if len(snapshot) == 0 {
		rows, err := a.DB.QueryContext(r.Context(), "SELECT view,asset_id FROM photo_views WHERE set_id=$1", set)
		if err != nil {
			return nil, err
		}
		snapshot = map[string]string{}
		for rows.Next() {
			var view, id string
			if err = rows.Scan(&view, &id); err != nil {
				rows.Close()
				return nil, err
			}
			snapshot[view] = id
		}
		err = rows.Err()
		rows.Close()
		if err != nil {
			return nil, err
		}
	}
	if len(snapshot) > 8 {
		return nil, fmt.Errorf("invalid photo view snapshot")
	}
	seen := map[string]bool{}
	for view, id := range snapshot {
		if !validPhotoView(view) || !isID(id) || seen[id] {
			return nil, fmt.Errorf("invalid photo view snapshot")
		}
		seen[id] = true
		var found string
		if a.DB.QueryRowContext(r.Context(), "SELECT id FROM assets WHERE id=$1 AND client_id=$2 AND organization_id=$3 AND kind='source'", id, r.PathValue("clientID"), userFrom(r).OrganizationID).Scan(&found) != nil {
			return nil, fmt.Errorf("saved source photo is no longer available")
		}
	}
	return snapshot, nil
}
