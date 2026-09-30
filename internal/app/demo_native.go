package app

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"
	"time"
)

type NativeDemoSettings struct {
	FocalLength    float64 `json:"focalLength"`
	CameraDistance float64 `json:"cameraDistance"`
	CameraHeight   float64 `json:"cameraHeight"`
	FitRounds      int     `json:"fitRounds"`
}

func nativeDemoDefaults() NativeDemoSettings {
	return NativeDemoSettings{FocalLength: 70, CameraDistance: 1.6, CameraHeight: .04, FitRounds: 4}
}
func (s *NativeDemoSettings) defaultsAndValidate() string {
	if *s == (NativeDemoSettings{}) {
		*s = nativeDemoDefaults()
	}
	return s.validate()
}
func (s NativeDemoSettings) validate() string {
	if !(s.FocalLength >= 20 && s.FocalLength <= 200 && s.CameraDistance >= .5 && s.CameraDistance <= 3 && s.CameraHeight >= -.2 && s.CameraHeight <= .3 && s.FitRounds >= 1 && s.FitRounds <= 6) {
		return "camera settings or fitting rounds outside supported bounds"
	}
	return ""
}
func nativeDemoRoot() string { return strings.TrimSpace(os.Getenv("LOCAL_DEMO_ROOT")) }
func validColmapPreset(preset string) bool {
	return preset == "standard" || preset == "sensitive-calibrated"
}

type demoProcess struct {
	cmd      *exec.Cmd
	done     chan struct{}
	mu       sync.Mutex
	finished bool
}

func (p *demoProcess) stop() {
	p.mu.Lock()
	defer p.mu.Unlock()
	if !p.finished {
		_ = syscall.Kill(-p.cmd.Process.Pid, syscall.SIGKILL)
	}
}
func (p *demoProcess) wait() error {
	err := p.cmd.Wait()
	p.mu.Lock()
	p.finished = true
	close(p.done)
	p.mu.Unlock()
	return err
}
func (a *App) processNativeDemo(parent context.Context, id string) {
	// Linux parent-death signals follow the creating thread. Keep that thread
	// alive until the child has exited, including while the Go goroutine waits.
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()
	ctx, cancel := context.WithTimeout(parent, 5*time.Minute)
	defer cancel()
	unlock, err := a.lockMedia()
	if err != nil {
		return
	}
	if !a.demoRunAllowed(ctx, id) {
		unlock()
		return
	}
	var client, candidate, settings string
	err = a.DB.QueryRowContext(ctx, "SELECT r.client_id,j.candidate,j.settings FROM generation_runs r JOIN demo_jobs j ON j.run_id=r.id WHERE r.id=$1", id).Scan(&client, &candidate, &settings)
	var in struct {
		Native       NativeDemoSettings    `json:"native"`
		Component    ComponentDemoSettings `json:"component"`
		ColmapPreset string                `json:"colmapPreset"`
	}
	if err == nil {
		err = json.Unmarshal([]byte(settings), &in)
	}
	var inputs []demoInput
	if err == nil {
		inputs, err = a.demoInputs(ctx, id)
	}
	if err == nil {
		var result sql.Result
		result, err = a.DB.ExecContext(ctx, "UPDATE generation_runs SET status='running' WHERE id=$1 AND status='queued'", id)
		if err == nil {
			count, _ := result.RowsAffected()
			if count != 1 {
				unlock()
				return
			}
		}
	}
	dir := a.demoJobDirectory(client, id)
	manifestInputs := []map[string]string{}
	if err == nil {
		err = os.MkdirAll(filepath.Join(dir, "inputs"), 0700)
	}
	for _, input := range inputs {
		if err != nil {
			break
		}
		var reader io.ReadCloser
		reader, err = a.Storage.Get(ctx, input.Key)
		if err != nil {
			break
		}
		data, readErr := io.ReadAll(io.LimitReader(reader, (10<<20)+1))
		reader.Close()
		err = readErr
		if err == nil {
			_, err = analyzeDemoInput(ctx, input, data, 64)
		}
		relative := "inputs/" + input.View + ".image"
		if err == nil {
			err = os.WriteFile(filepath.Join(dir, relative), data, 0600)
		}
		manifestInputs = append(manifestInputs, map[string]string{"view": input.View, "assetId": input.ID, "path": relative})
	}
	var upstream map[string]any
	if err == nil && componentCandidate(candidate) {
		upstream, err = a.copyComponentSource(ctx, client, id, dir)
	}
	if err == nil {
		err = os.WriteFile(filepath.Join(dir, "manifest.json"), rawJSON(map[string]any{"inputs": manifestInputs, "settings": in.Native, "colmapPreset": in.ColmapPreset, "component": in.Component, "upstream": upstream, "notice": "Authorized six-photo input snapshot; camera parameters are declared assumptions, not measured calibration."}), 0600)
	}
	var process *demoProcess
	var log *os.File
	if err == nil {
		root := nativeDemoRoot()
		cmd := exec.Command("unshare", "--user", "--map-root-user", "--net", "--", filepath.Join(root, ".scratch/private/native-demos/python/bin/python"), filepath.Join(root, "scripts/native-demos/run.py"), candidate, dir)
		cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true, Pdeathsig: syscall.SIGKILL}
		cmd.Dir = root
		cmd.Env = append(os.Environ(), fmt.Sprintf("TRAMA_NATIVE_PARENT_PID=%d", os.Getpid()))
		log, err = os.OpenFile(filepath.Join(dir, "processing.log"), os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0600)
		if err == nil {
			cmd.Stdout = log
			cmd.Stderr = log
			err = cmd.Start()
		}
		if err == nil {
			process = &demoProcess{cmd: cmd, done: make(chan struct{})}
			a.demoMu.Lock()
			a.demoProcesses[id] = process
			a.demoMu.Unlock()
		}
	}
	unlock()
	if process != nil {
		go func() {
			select {
			case <-ctx.Done():
				process.stop()
			case <-process.done:
			}
		}()
		progressDone := make(chan struct{})
		go func() {
			defer close(progressDone)
			ticker := time.NewTicker(time.Second)
			defer ticker.Stop()
			for {
				select {
				case <-process.done:
					return
				case <-ctx.Done():
					return
				case <-ticker.C:
					guard, e := a.lockMedia()
					if e != nil {
						return
					}
					if a.demoRunAllowed(ctx, id) {
						if raw, e := os.ReadFile(filepath.Join(dir, "progress.json")); e == nil {
							var progress struct {
								Percent int `json:"percent"`
							}
							if json.Unmarshal(raw, &progress) == nil && progress.Percent >= 0 && progress.Percent <= 100 {
								_, _ = a.DB.ExecContext(ctx, "UPDATE demo_jobs SET progress=$1 WHERE run_id=$2", progress.Percent, id)
							}
						}
					}
					guard()
				}
			}
		}()
		err = process.wait()
		<-progressDone
		a.demoMu.Lock()
		delete(a.demoProcesses, id)
		a.demoMu.Unlock()
	}
	if log != nil {
		_ = log.Close()
	}
	if ctx.Err() != nil {
		err = errors.New("local process cancelled or exceeded five-minute limit")
	}
	a.publishNativeDemo(parent, id, client, dir, err)
}
func (a *App) publishNativeDemo(ctx context.Context, id, client, dir string, processingErr error) bool {
	unlock, err := a.lockMedia()
	if err != nil {
		return false
	}
	defer unlock()
	if !a.demoRunAllowed(ctx, id) {
		return false
	}
	result := map[string]any{}
	if processingErr == nil {
		raw, readErr := os.ReadFile(filepath.Join(dir, "result.json"))
		err = readErr
		if err == nil {
			err = json.Unmarshal(raw, &result)
		}
		if err == nil {
			err = validateNativeArtifacts(dir, result)
		}
		if err != nil {
			processingErr = errors.New("native processing did not retain a valid model and compatible style assets")
		}
	}
	status, message := "completed", ""
	if processingErr != nil {
		status = "failed"
		message = "Native processing failed; retained diagnostics describe the failure"
		if strings.Contains(processingErr.Error(), "five-minute") {
			message = processingErr.Error()
		}
		result = map[string]any{"geometry": "No verified fitted result retained", "scope": "Failed native experiment. No fallback counted as candidate success."}
		if raw, e := os.ReadFile(filepath.Join(dir, "failure.json")); e == nil {
			var failure any
			if json.Unmarshal(raw, &failure) == nil {
				result["failure"] = failure
			}
		}
		if file, e := safeNativeFile(dir, "colmap-report.json"); e == nil {
			if raw, e := os.ReadFile(file); e == nil {
				var reconstruction map[string]any
				if json.Unmarshal(raw, &reconstruction) == nil && reconstruction["candidate"] == "colmap" {
					result["reconstruction"] = reconstruction
					result["geometry"] = reconstruction["geometry"]
				}
			}
		}
	}
	diagnostics := []string{}
	for key, relative := range nativeDiagnostics() {
		if _, e := safeNativeFile(dir, relative); e == nil {
			diagnostics = append(diagnostics, key)
		}
	}
	result["diagnostics"] = diagnostics
	tx, err := a.DB.BeginTx(ctx, nil)
	if err != nil {
		return false
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(ctx, "UPDATE demo_jobs SET result=$1,progress=100 WHERE run_id=$2", string(rawJSON(result)), id)
	if err == nil {
		_, err = tx.ExecContext(ctx, "UPDATE generation_runs SET status=$1,error=$2,completed_at=$3 WHERE id=$4 AND status='running'", status, message, now(), id)
	}
	if err == nil {
		err = tx.Commit()
	}
	return err == nil
}
func validateNativeArtifacts(dir string, result map[string]any) error {
	if result["head"] != "head.glb" {
		return errors.New("missing actual fitted head")
	}
	files := []string{"head.glb"}
	if photo, ok := result["photoTexture"].(map[string]any); ok {
		if result["candidate"] != "flame" || (photo["version"] != "six-photo-projection-v1" && photo["version"] != "six-photo-projection-v2") {
			return errors.New("unexpected photo projection experiment")
		}
		files = append(files, "photo-texture/head.glb", "photo-texture/authorized-photo-atlas.png")
		for _, view := range requiredPhotoViews {
			files = append(files, "photo-texture/"+view+".png")
		}
	}
	for _, kind := range []string{"hair", "beard"} {
		styles, err := readDemoStyles(kind)
		if err != nil {
			return err
		}
		entries, ok := result[kind].(map[string]any)
		if !ok || len(entries) != len(styles) {
			return errors.New("missing fitted independent styles")
		}
		for _, s := range styles {
			relative := kind + "/" + s.ID + ".glb"
			if entries[s.ID] != relative {
				return errors.New("unexpected style artifact")
			}
			files = append(files, relative)
		}
	}
	for _, relative := range files {
		file, err := safeNativeFile(dir, relative)
		if err != nil {
			return err
		}
		f, err := os.Open(file)
		if err != nil {
			return err
		}
		header := make([]byte, 12)
		_, err = io.ReadFull(f, header)
		f.Close()
		validHeader := string(header[:4]) == "glTF"
		if strings.HasSuffix(relative, ".png") {
			validHeader = string(header[:8]) == "\x89PNG\r\n\x1a\n"
		}
		if err != nil || !validHeader {
			return errors.New("invalid native GLB")
		}
	}
	return nil
}
func safeNativeFile(dir, relative string) (string, error) {
	file, err := filepath.EvalSymlinks(filepath.Join(dir, relative))
	if err != nil {
		return "", err
	}
	root, err := filepath.EvalSymlinks(dir)
	if err != nil {
		return "", err
	}
	rel, err := filepath.Rel(root, file)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", errors.New("artifact outside private job directory")
	}
	return file, nil
}
func (a *App) nativeDemoArtifact(w http.ResponseWriter, r *http.Request) {
	unlock, err := a.lockMedia()
	if err != nil {
		problem(w, 503, "privacy recovery is required")
		return
	}
	defer unlock()
	if !a.authorizeDemoClient(w, r) {
		return
	}
	id, client := r.PathValue("runID"), r.PathValue("clientID")
	var status, kind, candidate string
	var count int
	err = a.DB.QueryRowContext(r.Context(), "SELECT r.status,j.kind,j.candidate,(SELECT count(*) FROM demo_job_inputs i JOIN assets s ON s.id=i.asset_id WHERE i.run_id=r.id) FROM generation_runs r JOIN demo_jobs j ON j.run_id=r.id WHERE r.id=$1 AND r.client_id=$2 AND r.organization_id=$3", id, client, userFrom(r).OrganizationID).Scan(&status, &kind, &candidate, &count)
	if err != nil || (status != "completed" && status != "failed") || count != 6 || !a.nativeParentsAvailable(r.Context(), id) {
		problem(w, 404, "retained artifact not found")
		return
	}
	artifactKind, artifactID := r.PathValue("kind"), r.PathValue("artifactID")
	relative := ""
	if artifactKind == "head" && artifactID == "model" && nativeModelKind(kind) && status == "completed" {
		relative = "head.glb"
	}
	if candidate == "flame" && kind == "fit" && status == "completed" {
		if artifactKind == "photo-texture" && artifactID == "model" {
			relative = "photo-texture/head.glb"
		}
		if artifactKind == "photo-texture" && artifactID == "atlas" {
			relative = "photo-texture/authorized-photo-atlas.png"
		}
		if artifactKind == "photo-texture-render" {
			for _, view := range requiredPhotoViews {
				if artifactID == view {
					relative = "photo-texture/" + view + ".png"
				}
			}
		}
	}
	if (artifactKind == "hair" || artifactKind == "beard") && nativeModelKind(kind) && status == "completed" {
		styles, _ := readDemoStyles(artifactKind)
		for _, s := range styles {
			if s.ID == artifactID {
				relative = artifactKind + "/" + s.ID + ".glb"
			}
		}
	}
	if artifactKind == "render" || artifactKind == "landmarks" || artifactKind == "silhouette" {
		for _, view := range requiredPhotoViews {
			if view == artifactID {
				if artifactKind == "render" && status == "completed" {
					relative = "fitted-renders/" + view + ".png"
				}
				if artifactKind == "landmarks" {
					relative = view + "-landmarks.png"
				}
				if artifactKind == "silhouette" && status == "completed" && kind == "fit" {
					relative = "silhouette-" + view + ".png"
				}
			}
		}
	}
	if artifactKind == "diagnostic" {
		relative = nativeDiagnostics()[artifactID]
	}
	if artifactKind == "geometry" && kind == "process" && status == "completed" {
		relative = map[string]string{"sampled-cloud": "upstream-sampled.ply", "filtered-cloud": "processed-points.ply", "processed-skin": "processed-skin.ply", "comparison-before": "comparison-before.ply", "comparison-aligned": "comparison-aligned.ply"}[artifactID]
	}
	if artifactKind == "evaluation" && artifactID == "geometry" && kind == "process" {
		relative = "component-evaluation.png"
	}
	if artifactKind == "evaluation" && artifactID == "matches" && kind == "reconstruct" {
		relative = "colmap-matches.png"
	}
	if relative == "" {
		problem(w, 404, "retained artifact not found")
		return
	}
	file, err := safeNativeFile(a.demoJobDirectory(client, id), relative)
	if err != nil {
		problem(w, 404, "retained artifact not found")
		return
	}
	w.Header().Set("Cache-Control", "private, no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	if strings.HasSuffix(relative, ".glb") {
		w.Header().Set("Content-Type", "model/gltf-binary")
	} else if strings.HasSuffix(relative, ".ply") {
		w.Header().Set("Content-Type", "application/octet-stream")
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filepath.Base(relative)))
	} else if strings.HasSuffix(relative, ".png") {
		w.Header().Set("Content-Type", "image/png")
	} else {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	}
	http.ServeFile(w, r, file)
}
func nativeDiagnostics() map[string]string {
	return map[string]string{"photo-texture": "photo-texture-report.json", "silhouettes": "silhouette-report.json", "prepare": "prepare.log", "fit": "fit.log", "export": "export.log", "process": "processing.log", "resources": "resources.json", "settings": "manifest.json", "result": "result.json", "failure": "failure.json", "colmap": "colmap.log", "reconstruction": "colmap-report.json", "colmap-resources": "colmap-resources.json", "makehuman-shape": "makehuman-shape.json", "flame-shape": "flame-shape.json", "flame-styles": "flame-style-adaptation.json", "flame-attribution": "flame-attribution.json", "target-basis": "target-basis-check.json", "component": "component-report.json", "meshlab": "meshlab.log", "cloudcompare": "cloudcompare.log", "cloudcompare-icp": "cloudcompare-native/icp.log", "cloudcompare-sampling": "cloudcompare-native/sample-convert-distance.log", "cloudcompare-trace": "cloudcompare-native/registration_trace_log.csv", "cloudcompare-matrix": "cloudcompare-native/known-transform_REGISTRATION_MATRIX.txt"}
}
func (a *App) completedNativeModel(r *http.Request, state DemoWorkspaceState) bool {
	var candidate, status, kind string
	err := a.DB.QueryRowContext(r.Context(), "SELECT j.candidate,r.status,j.kind FROM generation_runs r JOIN demo_jobs j ON j.run_id=r.id WHERE r.id=$1 AND r.client_id=$2 AND r.organization_id=$3", state.ModelRunID, r.PathValue("clientID"), userFrom(r).OrganizationID).Scan(&candidate, &status, &kind)
	if err != nil || candidate != state.Candidate || status != "completed" || !nativeModelKind(kind) || !a.nativeParentsAvailable(r.Context(), state.ModelRunID) {
		return false
	}
	inputs, err := a.demoInputs(r.Context(), state.ModelRunID)
	if err != nil || len(inputs) != 6 {
		return false
	}
	for _, input := range inputs {
		if state.PhotoViews[input.View] != input.ID {
			return false
		}
	}
	_, err = safeNativeFile(a.demoJobDirectory(r.PathValue("clientID"), state.ModelRunID), "head.glb")
	return err == nil
}
func nativeGeometry(state DemoWorkspaceState) string {
	if state.ModelRunID != "" {
		if componentCandidate(state.Candidate) {
			return fmt.Sprintf("%s processing of an explicitly identified upstream fitted head; inferred hidden surfaces; professional review pending", state.Candidate)
		}
		return fmt.Sprintf("%s fitted head; hidden surfaces inferred; professional likeness review pending", state.Candidate)
	}
	return "Shared synthetic mannequin asset inspection"
}
