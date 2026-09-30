package app

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

type DemoJob struct {
	ID         string            `json:"id"`
	Candidate  string            `json:"candidate"`
	Kind       string            `json:"kind"`
	PhotoSetID string            `json:"photoSetId"`
	PhotoViews map[string]string `json:"photoViews"`
	Status     string            `json:"status"`
	Error      string            `json:"error"`
	Progress   int               `json:"progress"`
	Settings   json.RawMessage   `json:"settings"`
	Result     json.RawMessage   `json:"result"`
	CreatedAt  time.Time         `json:"createdAt"`
}
type demoInput struct{ View, ID, Key string }
type DemoInputMetric struct {
	View           string   `json:"view"`
	AssetID        string   `json:"assetId"`
	SHA256         string   `json:"sha256"`
	Width          int      `json:"width"`
	Height         int      `json:"height"`
	Bytes          int      `json:"bytes"`
	MeanBrightness float64  `json:"meanBrightness"`
	EdgeContrast   float64  `json:"edgeContrast"`
	Warnings       []string `json:"warnings"`
}
type DemoInputReport struct {
	Scope       string            `json:"scope"`
	Geometry    string            `json:"geometry"`
	Inputs      []DemoInputMetric `json:"inputs"`
	ElapsedMS   int64             `json:"elapsedMs"`
	CompletedAt time.Time         `json:"completedAt"`
}

func (a *App) startDemoProcessing() error {
	a.demoMu.Lock()
	a.demoContext, a.demoCancel = context.WithCancel(context.Background())
	a.demoRuns = make(map[string]context.CancelFunc)
	a.demoProcesses = make(map[string]*demoProcess)
	a.demoSlots = make(chan struct{}, 2)
	a.demoMu.Unlock()
	// Interrupted work is never presented as successful or automatically restored.
	_, err := a.DB.Exec("UPDATE generation_runs SET status='failed',error='Local process interrupted; start a new experiment',completed_at=$1 WHERE status='running' AND id IN(SELECT run_id FROM demo_jobs)", now())
	if err != nil {
		return err
	}
	rows, err := a.DB.Query("SELECT id FROM generation_runs WHERE status='queued' AND id IN(SELECT run_id FROM demo_jobs)")
	if err != nil {
		return err
	}
	ids := []string{}
	for rows.Next() {
		var id string
		if err = rows.Scan(&id); err != nil {
			rows.Close()
			return err
		}
		ids = append(ids, id)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return err
	}
	for _, id := range ids {
		a.launchDemoJob(id)
	}
	return nil
}
func (a *App) launchDemoJob(id string) {
	a.demoMu.Lock()
	if a.demoContext == nil || a.demoContext.Err() != nil {
		a.demoMu.Unlock()
		return
	}
	if _, exists := a.demoRuns[id]; exists {
		a.demoMu.Unlock()
		return
	}
	ctx, cancel := context.WithCancel(a.demoContext)
	a.demoRuns[id] = cancel
	a.demoWait.Add(1)
	a.demoMu.Unlock()
	go func() {
		defer a.demoWait.Done()
		defer cancel()
		defer func() { a.demoMu.Lock(); delete(a.demoRuns, id); a.demoMu.Unlock() }()
		select {
		case a.demoSlots <- struct{}{}:
			defer func() { <-a.demoSlots }()
		case <-ctx.Done():
			return
		}
		var kind string
		if a.DB.QueryRowContext(ctx, "SELECT kind FROM demo_jobs WHERE run_id=$1", id).Scan(&kind) != nil {
			return
		}
		if kind == "fit" || kind == "reconstruct" {
			a.processNativeDemo(ctx, id)
		} else {
			a.processDemoInputs(ctx, id)
		}
	}()
}
func (a *App) cancelLocalDemoRuns(ids []string) {
	a.demoMu.Lock()
	processes := []*demoProcess{}
	for _, id := range ids {
		if cancel := a.demoRuns[id]; cancel != nil {
			cancel()
		}
		if process := a.demoProcesses[id]; process != nil {
			processes = append(processes, process)
		}
	}
	a.demoMu.Unlock()
	// Wait only for OS process termination, never for publication or the worker
	// goroutine, which may be waiting for the media lock held by the eraser.
	for _, process := range processes {
		process.stop()
		<-process.done
	}
}
func (a *App) demoRunAllowed(ctx context.Context, id string) bool {
	var client, status string
	var count int
	if ctx.Err() != nil {
		return false
	}
	if a.DB.QueryRowContext(ctx, "SELECT client_id,status FROM generation_runs WHERE id=$1", id).Scan(&client, &status) != nil || (status != "queued" && status != "running") {
		return false
	}
	if !a.hasPermission(ctx, client) {
		return false
	}
	if a.DB.QueryRowContext(ctx, "SELECT count(*) FROM demo_job_inputs i JOIN assets s ON s.id=i.asset_id WHERE i.run_id=$1 AND s.client_id=$2 AND s.kind='source'", id, client).Scan(&count) != nil {
		return false
	}
	return count == len(requiredPhotoViews)
}
func (a *App) demoJobDirectory(client, id string) string {
	return filepath.Join(filepath.Dir(a.PrivacyLedgerPath), "processing", client, id)
}
func (a *App) demoInputs(ctx context.Context, id string) ([]demoInput, error) {
	rows, err := a.DB.QueryContext(ctx, "SELECT i.view,i.asset_id,s.storage_key FROM demo_job_inputs i JOIN assets s ON s.id=i.asset_id WHERE i.run_id=$1 ORDER BY i.view", id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []demoInput{}
	for rows.Next() {
		var x demoInput
		if err = rows.Scan(&x.View, &x.ID, &x.Key); err != nil {
			return nil, err
		}
		items = append(items, x)
	}
	return items, rows.Err()
}
func (a *App) processDemoInputs(ctx context.Context, id string) {
	start := time.Now()
	unlock, err := a.lockMedia()
	if err != nil {
		return
	}
	if !a.demoRunAllowed(ctx, id) {
		unlock()
		return
	}
	var client, settings string
	err = a.DB.QueryRowContext(ctx, "SELECT r.client_id,j.settings FROM generation_runs r JOIN demo_jobs j ON j.run_id=r.id WHERE r.id=$1", id).Scan(&client, &settings)
	var in struct {
		MinimumWidth int `json:"minimumWidth"`
	}
	if err == nil {
		err = json.Unmarshal([]byte(settings), &in)
	}
	var inputs []demoInput
	if err == nil {
		inputs, err = a.demoInputs(ctx, id)
	}
	if err == nil {
		var claim sql.Result
		claim, err = a.DB.ExecContext(ctx, "UPDATE generation_runs SET status='running' WHERE id=$1 AND status='queued'", id)
		if err == nil {
			count, claimErr := claim.RowsAffected()
			if claimErr != nil || count != 1 {
				unlock()
				return
			}
		}
	}
	unlock()
	if err != nil {
		return
	}
	report := DemoInputReport{Scope: "Six labeled views only; optional detail views excluded. Image diagnostics do not establish capture coverage or reconstruction suitability.", Geometry: "No head reconstructed or fitted by this input check.", Inputs: []DemoInputMetric{}}
	for index, x := range inputs {
		unlock, err = a.lockMedia()
		if err != nil {
			return
		}
		if !a.demoRunAllowed(ctx, id) {
			unlock()
			return
		}
		reader, readErr := a.Storage.Get(ctx, x.Key)
		var data []byte
		if readErr == nil {
			data, readErr = io.ReadAll(io.LimitReader(reader, (10<<20)+1))
			reader.Close()
		}
		unlock()
		if readErr != nil {
			err = fmt.Errorf("%s: source could not be read", x.View)
			break
		}
		var metric DemoInputMetric
		metric, err = analyzeDemoInput(ctx, x, data, in.MinimumWidth)
		if err != nil {
			break
		}
		report.Inputs = append(report.Inputs, metric)
		unlock, guardErr := a.lockMedia()
		if guardErr != nil {
			return
		}
		if a.demoRunAllowed(ctx, id) {
			_, _ = a.DB.ExecContext(ctx, "UPDATE demo_jobs SET progress=$1 WHERE run_id=$2", (index+1)*100/len(inputs), id)
		}
		unlock()
	}
	for i := range report.Inputs {
		for k := range report.Inputs {
			if i != k && report.Inputs[i].SHA256 == report.Inputs[k].SHA256 {
				report.Inputs[i].Warnings = append(report.Inputs[i].Warnings, "Identical image content in another labeled view; inspect capture coverage")
				break
			}
		}
	}
	report.ElapsedMS = time.Since(start).Milliseconds()
	report.CompletedAt = now()
	a.publishDemoReport(ctx, id, client, report, err)
}
func analyzeDemoInput(ctx context.Context, x demoInput, data []byte, minimumWidth int) (DemoInputMetric, error) {
	result := DemoInputMetric{View: x.View, AssetID: x.ID, Bytes: len(data), Warnings: []string{}}
	if len(data) > 10<<20 {
		return result, fmt.Errorf("%s: source exceeds input limit", x.View)
	}
	cfg, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil || cfg.Width < 1 || cfg.Height < 1 || cfg.Width > 12000 || cfg.Height > 12000 || int64(cfg.Width)*int64(cfg.Height) > 32_000_000 {
		return result, fmt.Errorf("%s: image cannot be decoded within input limits", x.View)
	}
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return result, fmt.Errorf("%s: image decoding failed", x.View)
	}
	result.Width = cfg.Width
	result.Height = cfg.Height
	digest := sha256.Sum256(data)
	result.SHA256 = hex.EncodeToString(digest[:])
	step := max(1, max(cfg.Width, cfg.Height)/128)
	var brightness, edge float64
	var samples, edges int
	grey := func(x, y int) float64 {
		r, g, b, _ := img.At(x, y).RGBA()
		return (.2126*float64(r) + .7152*float64(g) + .0722*float64(b)) / 65535
	}
	bounds := img.Bounds()
	for y := bounds.Min.Y; y < bounds.Max.Y; y += step {
		if ctx.Err() != nil {
			return result, ctx.Err()
		}
		for x := bounds.Min.X; x < bounds.Max.X; x += step {
			v := grey(x, y)
			brightness += v
			samples++
			if x+step < bounds.Max.X {
				edge += math.Abs(v - grey(x+step, y))
				edges++
			}
		}
	}
	result.MeanBrightness = math.Round(brightness/float64(samples)*10000) / 10000
	if edges > 0 {
		result.EdgeContrast = math.Round(edge/float64(edges)*10000) / 10000
	}
	if cfg.Width < minimumWidth {
		result.Warnings = append(result.Warnings, "Below the configured minimum width")
	}
	if result.MeanBrightness < .08 || result.MeanBrightness > .92 {
		result.Warnings = append(result.Warnings, "Extreme average exposure; inspect the source")
	}
	if result.EdgeContrast < .006 {
		result.Warnings = append(result.Warnings, "Low sampled edge contrast; inspect focus and framing")
	}
	return result, nil
}
func (a *App) publishDemoReport(ctx context.Context, id, client string, report DemoInputReport, processingErr error) bool {
	unlock, err := a.lockMedia()
	if err != nil {
		return false
	}
	defer unlock()
	if !a.demoRunAllowed(ctx, id) {
		return false
	}
	dir := a.demoJobDirectory(client, id)
	if err = os.MkdirAll(dir, 0700); err != nil {
		processingErr = errors.New("could not retain local report")
	}
	if err == nil {
		err = os.WriteFile(filepath.Join(dir, "input-report.json"), rawJSON(report), 0600)
		if err != nil {
			processingErr = errors.New("could not retain local report")
		}
	}
	status, message := "completed", ""
	if processingErr != nil {
		status = "failed"
		message = processingErr.Error()
	}
	tx, err := a.DB.BeginTx(ctx, nil)
	if err != nil {
		os.RemoveAll(dir)
		return false
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(ctx, "UPDATE demo_jobs SET result=$1 WHERE run_id=$2", string(rawJSON(report)), id)
	if err == nil {
		_, err = tx.ExecContext(ctx, "UPDATE generation_runs SET status=$1,error=$2,completed_at=$3 WHERE id=$4 AND status IN('queued','running')", status, message, now(), id)
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		os.RemoveAll(dir)
		return false
	}
	return true
}
func (a *App) createDemoJob(w http.ResponseWriter, r *http.Request) {
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
		Candidate    string             `json:"candidate"`
		Kind         string             `json:"kind"`
		Native       NativeDemoSettings `json:"native"`
		ColmapPreset string             `json:"colmapPreset"`
		PhotoSetID   string             `json:"photoSetId"`
		MinimumWidth int                `json:"minimumWidth"`
		PhotoViews   map[string]string  `json:"photoViews"`
	}
	in.Native = nativeDemoDefaults()
	in.ColmapPreset = "standard"
	if err = decodeJSON(r, &in); err != nil {
		badRequest(w, err)
		return
	}
	if in.Kind == "" {
		in.Kind = "input-check"
	}
	if !validColmapPreset(in.ColmapPreset) {
		problem(w, 400, "unsupported COLMAP preset")
		return
	}
	if in.Kind != "input-check" && in.Kind != "fit" && in.Kind != "reconstruct" {
		problem(w, 400, "unsupported experiment kind")
		return
	}
	if in.Kind == "fit" || in.Kind == "reconstruct" {
		if !((in.Candidate == "blender-mpfb" || in.Candidate == "makehuman" || in.Candidate == "flame") && in.Kind == "fit" || in.Candidate == "colmap" && in.Kind == "reconstruct") {
			problem(w, 400, "native route is not configured yet")
			return
		}
		if nativeDemoRoot() == "" {
			problem(w, 503, "local native processing is not configured")
			return
		}
		if message := in.Native.validate(); message != "" {
			problem(w, 400, message)
			return
		}
	}
	if !validDemoCandidate(in.Candidate) || in.MinimumWidth < 64 || in.MinimumWidth > 4096 {
		problem(w, 400, "select a demo candidate and minimum width between 64 and 4096")
		return
	}
	if !a.photoSetExists(r, in.PhotoSetID, r.PathValue("clientID")) {
		problem(w, 404, "photo set not found")
		return
	}
	inputs, err := a.resolveDemoPhotoViews(r, in.PhotoSetID, in.PhotoViews)
	if err != nil {
		problem(w, 400, err.Error())
		return
	}
	for _, view := range requiredPhotoViews {
		if inputs[view] == "" {
			problem(w, 400, "complete all six required photo views before processing")
			return
		}
	}
	settings := rawJSON(map[string]any{"minimumWidth": in.MinimumWidth, "native": in.Native, "colmapPreset": in.ColmapPreset, "photoViews": inputs})
	x := DemoJob{ID: newID(), Candidate: in.Candidate, Kind: in.Kind, PhotoSetID: in.PhotoSetID, PhotoViews: inputs, Status: "queued", Settings: settings, Result: json.RawMessage("{}"), CreatedAt: now()}
	tx, err := a.DB.BeginTx(r.Context(), nil)
	if err != nil {
		problem(w, 500, "could not queue local input check")
		return
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(r.Context(), "INSERT INTO generation_runs(id,organization_id,client_id,source_asset_id,prompt,model_id,quantity,status,created_by,created_at) VALUES($1,$2,$3,$4,'Six-view image diagnostics',$5,1,'queued',$6,$7)", x.ID, userFrom(r).OrganizationID, r.PathValue("clientID"), inputs["front"], "local-3d:"+in.Candidate, userFrom(r).ID, x.CreatedAt)
	if err == nil {
		_, err = tx.ExecContext(r.Context(), "INSERT INTO demo_jobs(run_id,candidate,kind,photo_set_id,settings)VALUES($1,$2,$3,$4,$5)", x.ID, x.Candidate, x.Kind, x.PhotoSetID, string(x.Settings))
	}
	for _, view := range requiredPhotoViews {
		if err == nil {
			_, err = tx.ExecContext(r.Context(), "INSERT INTO demo_job_inputs(run_id,view,asset_id) VALUES($1,$2,$3)", x.ID, view, inputs[view])
		}
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		problem(w, 500, "could not queue local input check")
		return
	}
	a.launchDemoJob(x.ID)
	respond(w, 202, x)
}
func (a *App) listDemoJobs(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	if !a.authorizeDemoClient(w, r) {
		return
	}
	rows, err := a.DB.QueryContext(r.Context(), "SELECT r.id,j.candidate,j.kind,COALESCE(j.photo_set_id,''),r.status,r.error,j.progress,j.settings,j.result,r.created_at FROM generation_runs r JOIN demo_jobs j ON j.run_id=r.id WHERE r.client_id=$1 AND r.organization_id=$2 ORDER BY r.created_at DESC LIMIT 100", r.PathValue("clientID"), userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not load local experiments")
		return
	}
	defer rows.Close()
	items := []DemoJob{}
	for rows.Next() {
		var x DemoJob
		var settings, result string
		if err = rows.Scan(&x.ID, &x.Candidate, &x.Kind, &x.PhotoSetID, &x.Status, &x.Error, &x.Progress, &settings, &result, &x.CreatedAt); err != nil {
			problem(w, 500, "could not read local experiment")
			return
		}
		x.Settings = json.RawMessage(settings)
		var retained struct {
			PhotoViews map[string]string `json:"photoViews"`
		}
		_ = json.Unmarshal([]byte(settings), &retained)
		x.PhotoViews = retained.PhotoViews
		x.Result = json.RawMessage(result)
		items = append(items, x)
	}
	if rows.Err() != nil {
		problem(w, 500, "could not read local experiments")
		return
	}
	respond(w, 200, items)
}
func (a *App) cancelDemoJob(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	if !a.authorizeDemoClient(w, r) {
		return
	}
	id := r.PathValue("runID")
	result, err := a.DB.ExecContext(r.Context(), "UPDATE generation_runs SET status='cancelled',error='Cancelled by professional',completed_at=$1 WHERE id=$2 AND client_id=$3 AND organization_id=$4 AND id IN(SELECT run_id FROM demo_jobs)", now(), id, r.PathValue("clientID"), userFrom(r).OrganizationID)
	if err != nil {
		problem(w, 500, "could not cancel local experiment")
		return
	}
	count, _ := result.RowsAffected()
	if count != 1 {
		problem(w, 404, "local experiment not found")
		return
	}
	a.cancelLocalDemoRuns([]string{id})
	_, _ = a.DB.ExecContext(r.Context(), "DELETE FROM demo_workspace_states WHERE client_id=$1 AND json_extract(state,'$.modelRunId')=$2", r.PathValue("clientID"), id)
	_, _ = a.DB.ExecContext(r.Context(), "DELETE FROM demo_options WHERE client_id=$1 AND json_extract(state,'$.modelRunId')=$2", r.PathValue("clientID"), id)
	_, err = a.DB.ExecContext(r.Context(), "UPDATE demo_jobs SET result='{}' WHERE run_id=$1", id)
	if err == nil {
		err = os.RemoveAll(a.demoJobDirectory(r.PathValue("clientID"), id))
	}
	if err != nil {
		problem(w, 500, "cancelled; output cleanup must be retried")
		return
	}
	respond(w, 200, map[string]string{"status": "cancelled"})
}
