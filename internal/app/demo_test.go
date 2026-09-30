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
	return DemoWorkspaceState{Candidate: "blender-mpfb", PhotoSetID: set, CurrentHairID: "sample", CurrentBeardID: "clean-shaven", HairID: "keep-current", BeardID: "sample", Camera: DemoCamera{Azimuth: .5, Elevation: .2, Distance: 1.1}, MinimumWidth: 512}
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
