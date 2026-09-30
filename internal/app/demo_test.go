package app

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"reflect"
	"testing"
	"time"
)

func demoFixture(t *testing.T) privacyFixture {
	f := newPrivacyFixture(t)
	root := t.TempDir()
	t.Setenv("DEMO_ASSET_DIR", root)
	for _, kind := range []string{"hair", "beard"} {
		records := []map[string]any{{"id": "sample", "label": "Test asset", "glb": kind + "/sample.glb", "render": kind + "/sample.png", "license": "CC0-1.0"}}
		if err := os.WriteFile(filepath.Join(root, kind+"-catalog.json"), rawJSON(records), 0600); err != nil {
			t.Fatal(err)
		}
		if err := os.MkdirAll(filepath.Join(root, kind), 0700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(root, kind, "sample.glb"), []byte("test fixture only"), 0600); err != nil {
			t.Fatal(err)
		}
	}
	return f
}
func demoState(set string) DemoWorkspaceState {
	return DemoWorkspaceState{Candidate: "blender-mpfb", ColmapPreset: "standard", PhotoSetID: set, CurrentHairID: "sample", CurrentBeardID: "clean-shaven", HairID: "keep-current", BeardID: "sample", Camera: DemoCamera{Azimuth: .5, Elevation: .2, Distance: 1.1}, MinimumWidth: 512, Native: NativeDemoSettings{FocalLength: 70, CameraDistance: 1.6, CameraHeight: .04, FitRounds: 4}}
}
func demoCapture(t *testing.T, f privacyFixture, corrupt bool) PhotoSet {
	w := f.request(t, "POST", "/api/clients/"+f.client+"/photo-sets", map[string]string{"title": "Diagnostic fixture"})
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	s := responseRecord[PhotoSet](t, w.Body.Bytes())
	for _, view := range append(append([]string{}, requiredPhotoViews...), "crown", "under-chin") {
		if corrupt && view == "back" {
			id, _ := f.asset(t, "")
			w = f.request(t, "PATCH", "/api/photo-sets/"+s.ID+"/views/"+view, map[string]string{"assetId": id, "expectedAssetId": ""})
			if w.Code != 200 {
				t.Fatal(w.Code, w.Body.String())
			}
			s.Views[view] = id
		} else {
			w = f.uploadPhoto(t, s.ID, view, "", diagnosticImage(t, "png"))
			if w.Code != 201 {
				t.Fatal(w.Code, w.Body.String())
			}
			s.Views[view] = responseRecord[Asset](t, w.Body.Bytes()).ID
		}
	}
	return s
}
func waitDemoJob(t *testing.T, f privacyFixture, id, status string) DemoJob {
	t.Helper()
	deadline := time.Now().Add(4 * time.Second)
	for time.Now().Before(deadline) {
		w := f.request(t, "GET", "/api/clients/"+f.client+"/demo-jobs", nil)
		if w.Code != 200 {
			t.Fatal(w.Code, w.Body.String())
		}
		for _, j := range responseRecord[[]DemoJob](t, w.Body.Bytes()) {
			if j.ID == id && j.Status == status {
				return j
			}
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatal("job did not reach", status)
	return DemoJob{}
}
func queueDemo(t *testing.T, f privacyFixture, s PhotoSet) DemoJob {
	w := f.request(t, "POST", "/api/clients/"+f.client+"/demo-jobs", map[string]any{"candidate": "blender-mpfb", "photoSetId": s.ID, "minimumWidth": 512})
	if w.Code != 202 {
		t.Fatal(w.Code, w.Body.String())
	}
	return responseRecord[DemoJob](t, w.Body.Bytes())
}
func TestDemoWorkspaceAccessPersistenceAndAssetAllowlist(t *testing.T) {
	f := demoFixture(t)
	base := "/api/clients/" + f.client
	if w := f.request(t, "PUT", base+"/demo-workspace", map[string]any{"state": demoState(""), "version": 0}); w.Code != 403 {
		t.Fatal("workspace accepted without permission", w.Code)
	}
	f.acknowledge(t)
	s := demoCapture(t, f, false)
	state := demoState(s.ID)
	state.PhotoViews = s.Views
	w := f.request(t, "GET", "/api/demo-library", nil)
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	var library struct{ Candidates []DemoCandidate }
	if err := json.Unmarshal(w.Body.Bytes(), &library); err != nil || len(library.Candidates) != 8 {
		t.Fatal("candidate inventory", err)
	}
	w = f.request(t, "PUT", base+"/demo-workspace", map[string]any{"state": state, "version": 0})
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "PUT", base+"/demo-workspace", map[string]any{"state": state, "version": 0}); w.Code != 409 {
		t.Fatal("stale state accepted")
	}
	invalid := state
	invalid.ModelRunID = newID()
	if w = f.request(t, "PUT", base+"/demo-workspace", map[string]any{"state": invalid, "version": 1}); w.Code != 400 {
		t.Fatal("input report allowed as personal head")
	}
	invalid = state
	invalid.HairID = "missing"
	if w = f.request(t, "PUT", base+"/demo-workspace", map[string]any{"state": invalid, "version": 1}); w.Code != 400 {
		t.Fatal("unknown style accepted")
	}
	w = f.request(t, "POST", base+"/demo-options", map[string]any{"state": state, "title": "Saved camera and independent beard"})
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	reopened, err := Open(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	f.a = reopened
	var loaded struct {
		State   DemoWorkspaceState
		Version int
	}
	w = f.request(t, "GET", base+"/demo-workspace", nil)
	if err = json.Unmarshal(w.Body.Bytes(), &loaded); err != nil || !reflect.DeepEqual(loaded.State, state) || loaded.Version != 1 {
		t.Fatal("workspace changed across process reopen", err, w.Body.String())
	}
	options := responseRecord[[]DemoOption](t, f.request(t, "GET", base+"/demo-options", nil).Body.Bytes())
	if len(options) != 1 || !reflect.DeepEqual(options[0].State, state) {
		t.Fatal("option failed reopen")
	}
	anonymous := f
	anonymous.cookie = nil
	if w = anonymous.request(t, "GET", "/api/demo-library/hair/sample/model", nil); w.Code != 401 {
		t.Fatal("private library unauthenticated")
	}
	for _, path := range []string{"/api/demo-library/head/private/model", "/api/demo-library/hair/missing/model", "/api/demo-library/hair/sample/private"} {
		if w = f.request(t, "GET", path, nil); w.Code != 404 {
			t.Fatal("private path served", path, w.Code)
		}
	}
	secret := filepath.Join(t.TempDir(), "secret.glb")
	os.WriteFile(secret, []byte("private fixture"), 0600)
	os.Remove(filepath.Join(demoAssetRoot(), "hair", "sample.glb"))
	os.Symlink(secret, filepath.Join(demoAssetRoot(), "hair", "sample.glb"))
	if w = f.request(t, "GET", "/api/demo-library/hair/sample/model", nil); w.Code != 404 {
		t.Fatal("symlink escape served")
	}
	other := f
	other.client = newID()
	if w = other.request(t, "GET", "/api/clients/"+other.client+"/demo-workspace", nil); w.Code != 404 {
		t.Fatal("unknown client accessed")
	}
}
func TestDemoInputDiagnosticsAndNonFrontErasure(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	s := demoCapture(t, f, false)
	base := "/api/clients/" + f.client
	j := queueDemo(t, f, s)
	j = waitDemoJob(t, f, j.ID, "completed")
	var report DemoInputReport
	if err := json.Unmarshal(j.Result, &report); err != nil || len(report.Inputs) != 6 {
		t.Fatal("six input report", err)
	}
	for _, x := range report.Inputs {
		if x.Width != 24 || len(x.SHA256) != 64 || len(x.Warnings) < 1 || x.View == "crown" || x.View == "under-chin" {
			t.Fatal("incorrect metrics or extra capture arm", x)
		}
	}
	dir := f.a.demoJobDirectory(f.client, j.ID)
	if _, err := os.Stat(filepath.Join(dir, "input-report.json")); err != nil {
		t.Fatal("report not retained", err)
	}
	state := demoState(s.ID)
	state.PhotoViews = s.Views
	f.request(t, "PUT", base+"/demo-workspace", map[string]any{"state": state, "version": 0})
	f.request(t, "POST", base+"/demo-options", map[string]any{"state": state, "title": "Dependent option"})
	w := f.request(t, "DELETE", "/api/assets/"+s.Views["back"], map[string]bool{"confirmed": true})
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	j = waitDemoJob(t, f, j.ID, "cancelled")
	if string(j.Result) != "{}" {
		t.Fatal("removed source left report")
	}
	if _, err := os.Stat(dir); !os.IsNotExist(err) {
		t.Fatal("nonfront source left processing output")
	}
	if f.a.publishDemoReport(context.Background(), j.ID, f.client, report, nil) {
		t.Fatal("late result recreated erased report")
	}
	if _, err := os.Stat(dir); !os.IsNotExist(err) {
		t.Fatal("late result recreated directory")
	}
	w = f.request(t, "GET", base+"/demo-options", nil)
	if string(w.Body.Bytes()) != "[]\n" {
		t.Fatal("dependent option retained", w.Body.String())
	}
	var workspace struct {
		State   *DemoWorkspaceState
		Version int
	}
	json.Unmarshal(f.request(t, "GET", base+"/demo-workspace", nil).Body.Bytes(), &workspace)
	if workspace.State != nil || workspace.Version != 0 {
		t.Fatal("erased view retained in workspace")
	}
	if w = f.request(t, "POST", base+"/demo-jobs", map[string]any{"candidate": "colmap", "photoSetId": s.ID, "minimumWidth": 512}); w.Code != 400 {
		t.Fatal("incomplete capture queued")
	}
}
func TestDemoFailureCancellationAndWithdrawal(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	s := demoCapture(t, f, true)
	j := queueDemo(t, f, s)
	j = waitDemoJob(t, f, j.ID, "failed")
	if j.Error == "" {
		t.Fatal("decode failure concealed")
	}
	f.a.demoSlots <- struct{}{}
	f.a.demoSlots <- struct{}{}
	queued := queueDemo(t, f, s)
	w := f.request(t, "POST", "/api/clients/"+f.client+"/demo-jobs/"+queued.ID+"/cancel", nil)
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	waitDemoJob(t, f, queued.ID, "cancelled")
	<-f.a.demoSlots
	<-f.a.demoSlots
	state := demoState("")
	f.request(t, "PUT", "/api/clients/"+f.client+"/demo-workspace", map[string]any{"state": state, "version": 0})
	f.request(t, "POST", "/api/clients/"+f.client+"/demo-options", map[string]any{"state": state, "title": "No photo selected"})
	w = f.request(t, "POST", "/api/clients/"+f.client+"/withdraw", map[string]bool{"confirmed": true})
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	for _, path := range []string{"demo-jobs", "demo-options", "demo-workspace"} {
		if w = f.request(t, "GET", "/api/clients/"+f.client+"/"+path, nil); w.Code != 403 {
			t.Fatal("withdrawn data served", path, w.Code)
		}
	}
	var count int
	f.a.DB.QueryRow("SELECT count(*) FROM demo_options WHERE client_id=$1", f.client).Scan(&count)
	if count != 0 {
		t.Fatal("withdrawal retained generic-context options")
	}
	if f.a.publishDemoReport(context.Background(), j.ID, f.client, DemoInputReport{}, nil) {
		t.Fatal("withdrawn result recreated")
	}
}
func TestDemoRestartDistinguishesInterruptedWork(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	s := demoCapture(t, f, false)
	j := queueDemo(t, f, s)
	waitDemoJob(t, f, j.ID, "completed")
	f.a.DB.Exec("UPDATE generation_runs SET status='running',error='' WHERE id=$1", j.ID)
	f.a.Close()
	reopened, err := Open(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	f.a = reopened
	j = waitDemoJob(t, f, j.ID, "failed")
	if j.Error == "" {
		t.Fatal("interrupted run presented as completion")
	}
}

func TestDemoSavedInputsSurviveReplacementButNotErasure(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	s := demoCapture(t, f, false)
	base := "/api/clients/" + f.client
	original := s.Views["back"]
	w := f.request(t, "PUT", base+"/demo-workspace", map[string]any{"state": demoState(s.ID), "version": 0})
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	var saved struct {
		State   DemoWorkspaceState
		Version int
	}
	if err := json.Unmarshal(w.Body.Bytes(), &saved); err != nil || saved.State.PhotoViews["back"] != original {
		t.Fatal("assignments not snapshotted", err)
	}
	w = f.request(t, "POST", base+"/demo-options", map[string]any{"state": saved.State, "title": "Retained source assignment"})
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	w = f.uploadPhoto(t, s.ID, "back", original, diagnosticImage(t, "jpeg"))
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	replacement := responseRecord[Asset](t, w.Body.Bytes())
	w = f.request(t, "POST", base+"/demo-jobs", map[string]any{"candidate": "flame", "photoSetId": s.ID, "photoViews": saved.State.PhotoViews, "minimumWidth": 512})
	if w.Code != 202 {
		t.Fatal(w.Code, w.Body.String())
	}
	j := responseRecord[DemoJob](t, w.Body.Bytes())
	j = waitDemoJob(t, f, j.ID, "completed")
	var report DemoInputReport
	json.Unmarshal(j.Result, &report)
	for _, i := range report.Inputs {
		if i.View == "back" && i.AssetID != original {
			t.Fatal("reopened experiment silently used replacement")
		}
	}
	w = f.request(t, "DELETE", "/api/assets/"+original, map[string]bool{"confirmed": true})
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	waitDemoJob(t, f, j.ID, "cancelled")
	var workspace struct{ State *DemoWorkspaceState }
	json.Unmarshal(f.request(t, "GET", base+"/demo-workspace", nil).Body.Bytes(), &workspace)
	if workspace.State != nil {
		t.Fatal("erased snapshot retained in current workspace")
	}
	options := responseRecord[[]DemoOption](t, f.request(t, "GET", base+"/demo-options", nil).Body.Bytes())
	if len(options) != 0 {
		t.Fatal("erased snapshot option retained")
	}
	sets := responseRecord[[]PhotoSet](t, f.request(t, "GET", base+"/photo-sets", nil).Body.Bytes())
	if sets[0].Views["back"] != replacement.ID || len(sets[0].Missing) != 0 {
		t.Fatal("erasure changed unrelated replacement")
	}
}

func TestDemoQueuedWorkResumesAfterLocalRestart(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	s := demoCapture(t, f, false)
	f.a.demoSlots <- struct{}{}
	f.a.demoSlots <- struct{}{}
	j := queueDemo(t, f, s)
	f.a.Close()
	reopened, err := Open(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	f.a = reopened
	result := waitDemoJob(t, f, j.ID, "completed")
	var report DemoInputReport
	if err = json.Unmarshal(result.Result, &report); err != nil || len(report.Inputs) != 6 {
		t.Fatal("queued work did not resume with its original inputs", err)
	}
}

func TestNativeDemoSettingsAndUnconfiguredRoutes(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	s := demoCapture(t, f, false)
	t.Setenv("LOCAL_DEMO_ROOT", "")
	in := map[string]any{"candidate": "blender-mpfb", "photoSetId": s.ID, "minimumWidth": 512, "kind": "fit"}
	w := f.request(t, "POST", "/api/clients/"+f.client+"/demo-jobs", in)
	if w.Code != 503 {
		t.Fatal(w.Code, w.Body.String())
	}
	in["candidate"] = "makehuman"
	w = f.request(t, "POST", "/api/clients/"+f.client+"/demo-jobs", in)
	if w.Code != 503 {
		t.Fatal("standalone MakeHuman must obey the same local processing gate", w.Code, w.Body.String())
	}
	in["candidate"] = "blender-mpfb"
	t.Setenv("LOCAL_DEMO_ROOT", t.TempDir())
	in["native"] = map[string]any{"fitRounds": 99}
	w = f.request(t, "POST", "/api/clients/"+f.client+"/demo-jobs", in)
	if w.Code != 400 {
		t.Fatal(w.Code, w.Body.String())
	}
	in["native"] = map[string]any{"focalLength": 0}
	w = f.request(t, "POST", "/api/clients/"+f.client+"/demo-jobs", in)
	if w.Code != 400 {
		t.Fatal("explicit zero focal length silently defaulted", w.Code, w.Body.String())
	}
	in["candidate"] = "colmap"
	in["native"] = map[string]any{}
	w = f.request(t, "POST", "/api/clients/"+f.client+"/demo-jobs", in)
	if w.Code != 400 {
		t.Fatal(w.Code, w.Body.String())
	}
}
func TestNativeDemoErasureTerminatesChildBeforePurging(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	s := demoCapture(t, f, false)
	root := t.TempDir()
	t.Setenv("LOCAL_DEMO_ROOT", root)
	python := filepath.Join(root, ".scratch/private/native-demos/python/bin/python")
	script := filepath.Join(root, "scripts/native-demos/run.py")
	if err := os.MkdirAll(filepath.Dir(python), 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Dir(script), 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(python, []byte("#!/bin/sh\nexec /bin/sh \"$@\"\n"), 0700); err != nil {
		t.Fatal(err)
	}
	// A real subprocess continuously writes into the job directory. Purging
	// without terminating the whole group would recreate that directory.
	body := `#!/bin/sh
dir="$2"
while true; do
 mkdir -p "$dir"
 echo diagnostic-fixture > "$dir/child-alive"
 sleep .02
done
`
	if err := os.WriteFile(script, []byte(body), 0700); err != nil {
		t.Fatal(err)
	}
	w := f.request(t, "POST", "/api/clients/"+f.client+"/demo-jobs", map[string]any{"candidate": "blender-mpfb", "photoSetId": s.ID, "minimumWidth": 512, "kind": "fit"})
	if w.Code != 202 {
		t.Fatal(w.Code, w.Body.String())
	}
	job := responseRecord[DemoJob](t, w.Body.Bytes())
	dir := f.a.demoJobDirectory(f.client, job.ID)
	deadline := time.Now().Add(3 * time.Second)
	for {
		if _, err := os.Stat(filepath.Join(dir, "child-alive")); err == nil {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("real child did not start")
		}
		time.Sleep(10 * time.Millisecond)
	}
	w = f.request(t, "DELETE", "/api/assets/"+s.Views["right-profile"], map[string]bool{"confirmed": true})
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	time.Sleep(100 * time.Millisecond)
	if _, err := os.Stat(dir); !os.IsNotExist(err) {
		t.Fatal("child recreated deleted model directory", err)
	}
	var status, result string
	if err := f.a.DB.QueryRow("SELECT r.status,j.result FROM generation_runs r JOIN demo_jobs j ON j.run_id=r.id WHERE r.id=$1", job.ID).Scan(&status, &result); err != nil {
		t.Fatal(err)
	}
	if status != "cancelled" || result != "{}" {
		t.Fatal(status, result)
	}
	w = f.request(t, "GET", "/api/clients/"+f.client+"/demo-jobs/"+job.ID+"/artifacts/head/model", nil)
	if w.Code != 404 {
		t.Fatal(w.Code, w.Body.String())
	}
}
func TestNativeModelSelectionRequiresMatchingSourceSnapshot(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	s := demoCapture(t, f, false)
	state := demoState(s.ID)
	state.ModelRunID = "unknown"
	w := f.request(t, "PUT", "/api/clients/"+f.client+"/demo-workspace", map[string]any{"version": 0, "state": state})
	if w.Code != 400 {
		t.Fatal(w.Code, w.Body.String())
	}
	// Completed input diagnostics still cannot be selected as a fitted head.
	w = f.request(t, "POST", "/api/clients/"+f.client+"/demo-jobs", map[string]any{"candidate": "blender-mpfb", "photoSetId": s.ID, "minimumWidth": 512})
	if w.Code != 202 {
		t.Fatal(w.Code, w.Body.String())
	}
	job := responseRecord[DemoJob](t, w.Body.Bytes())
	waitDemoJob(t, f, job.ID, "completed")
	state.ModelRunID = job.ID
	w = f.request(t, "PUT", "/api/clients/"+f.client+"/demo-workspace", map[string]any{"version": 0, "state": state})
	if w.Code != 400 {
		t.Fatal(w.Code, w.Body.String())
	}
}

func TestColmapFailureRetainsEvidenceWithoutSelectableHead(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	s := demoCapture(t, f, false)
	root := t.TempDir()
	t.Setenv("LOCAL_DEMO_ROOT", root)
	python := filepath.Join(root, ".scratch/private/native-demos/python/bin/python")
	script := filepath.Join(root, "scripts/native-demos/run.py")
	for _, path := range []string{python, script} {
		if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(python, []byte("#!/bin/sh\nexec /bin/sh \"$@\"\n"), 0700); err != nil {
		t.Fatal(err)
	}
	// Exercise the publication boundary using a failed child, independently of
	// SIFT behavior. Live six-photo processing is verified separately.
	body := `#!/bin/sh
echo '{"candidate":"colmap","geometry":"No triangulated geometry retained","trials":[{"models":[]}]}' > "$2/colmap-report.json"
echo '{"error":"No sparse model"}' > "$2/failure.json"
exit 1
`
	if err := os.WriteFile(script, []byte(body), 0700); err != nil {
		t.Fatal(err)
	}
	base := "/api/clients/" + f.client
	in := map[string]any{"candidate": "colmap", "kind": "reconstruct", "photoSetId": s.ID, "minimumWidth": 512, "colmapPreset": "unknown"}
	if w := f.request(t, "POST", base+"/demo-jobs", in); w.Code != 400 {
		t.Fatal(w.Code, w.Body.String())
	}
	in["colmapPreset"] = "sensitive-calibrated"
	w := f.request(t, "POST", base+"/demo-jobs", in)
	if w.Code != 202 {
		t.Fatal(w.Code, w.Body.String())
	}
	job := responseRecord[DemoJob](t, w.Body.Bytes())
	failed := waitDemoJob(t, f, job.ID, "failed")
	var evidence map[string]any
	if err := json.Unmarshal(failed.Result, &evidence); err != nil {
		t.Fatal(err)
	}
	if evidence["reconstruction"] == nil || evidence["head"] != nil {
		t.Fatal("failure evidence lost or fallback exposed", evidence)
	}
	artifact := base + "/demo-jobs/" + job.ID + "/artifacts/diagnostic/reconstruction"
	if w = f.request(t, "GET", artifact, nil); w.Code != 200 || w.Header().Get("Cache-Control") != "private, no-store" {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "GET", base+"/demo-jobs/"+job.ID+"/artifacts/head/model", nil); w.Code != 404 {
		t.Fatal("failed reconstruction exposed a head", w.Code)
	}
	state := demoState(s.ID)
	state.Candidate = "colmap"
	state.ModelRunID = job.ID
	if w = f.request(t, "PUT", base+"/demo-workspace", map[string]any{"version": 0, "state": state}); w.Code != 400 {
		t.Fatal("failed reconstruction was selectable", w.Code)
	}
	if w = f.request(t, "DELETE", "/api/assets/"+s.Views["back"], map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "GET", artifact, nil); w.Code != 404 {
		t.Fatal("erased input retained reconstruction diagnostics", w.Code)
	}
	if _, err := os.Stat(f.a.demoJobDirectory(f.client, job.ID)); !os.IsNotExist(err) {
		t.Fatal("dependent native results not erased", err)
	}
}
