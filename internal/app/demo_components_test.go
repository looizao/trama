package app

import (
	"bytes"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestComponentICPSettingsBoundsAndLegacyDefaults(t *testing.T) {
	for _, tc := range []struct {
		iterations, overlap int
		valid               bool
	}{{0, 0, true}, {80, 100, true}, {10, 50, true}, {200, 100, true}, {9, 100, false}, {201, 100, false}, {80, 49, false}, {80, 101, false}, {-1, 100, false}} {
		s := componentDemoDefaults()
		s.SourceRunID = newID()
		s.ICPIterations, s.ICPOverlap = tc.iterations, tc.overlap
		if (s.validate() == "") != tc.valid {
			t.Fatalf("ICP bounds %d/%d returned %q", tc.iterations, tc.overlap, s.validate())
		}
	}
	if !componentCandidate("cloudcompare") || componentCandidate("unregistered-processor") {
		t.Fatal("incorrect supporting candidate allowlist")
	}
}

func TestCloudCompareReferenceIsASecondLiveDependency(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	set := demoCapture(t, f, false)
	primary, reference := completedComponentParent(t, f, set), completedComponentParent(t, f, set)
	t.Setenv("LOCAL_DEMO_ROOT", t.TempDir())
	f.a.demoSlots <- struct{}{}
	f.a.demoSlots <- struct{}{}
	defer func() { <-f.a.demoSlots; <-f.a.demoSlots }()
	base := "/api/clients/" + f.client
	settings := componentDemoDefaults()
	settings.SourceRunID, settings.ReferenceRunID = primary.ID, reference.ID
	payload := map[string]any{"candidate": "cloudcompare", "kind": "process", "minimumWidth": 512, "photoSetId": set.ID, "photoViews": set.Views, "component": settings}
	for _, invalid := range []string{primary.ID, newID()} {
		bad := settings
		bad.ReferenceRunID = invalid
		payload["component"] = bad
		if w := f.request(t, "POST", base+"/demo-jobs", payload); w.Code != 400 {
			t.Fatal("invalid comparison reference accepted", w.Code)
		}
	}
	payload["component"] = settings
	w := f.request(t, "POST", base+"/demo-jobs", payload)
	if w.Code != 202 {
		t.Fatal(w.Code, w.Body.String())
	}
	child := responseRecord[DemoJob](t, w.Body.Bytes())
	if !f.a.nativeParentsAvailable(context.Background(), child.ID) {
		t.Fatal("valid two-parent comparison denied")
	}
	f.a.DB.Exec("DELETE FROM demo_job_references WHERE run_id=$1 AND source_run_id=$2", child.ID, reference.ID)
	if f.a.nativeParentsAvailable(context.Background(), child.ID) {
		t.Fatal("missing reference dependency accepted")
	}
	f.a.DB.Exec("INSERT INTO demo_job_references(run_id,source_run_id) VALUES($1,$2)", child.ID, reference.ID)
	state := demoState(set.ID)
	state.Candidate, state.PhotoViews, state.Component = "cloudcompare", set.Views, settings
	if w = f.request(t, "PUT", base+"/demo-workspace", map[string]any{"state": state, "version": 0}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "POST", base+"/demo-options", map[string]any{"state": state, "title": "Two-parent input settings fixture"}); w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "POST", base+"/demo-jobs/"+reference.ID+"/cancel", nil); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if !f.a.nativeParentsAvailable(context.Background(), primary.ID) || f.a.nativeParentsAvailable(context.Background(), child.ID) {
		t.Fatal("reference erasure removed primary or retained derived access")
	}
	for _, table := range []string{"demo_options", "demo_workspace_states"} {
		var count int
		f.a.DB.QueryRow("SELECT count(*) FROM "+table+" WHERE client_id=$1", f.client).Scan(&count)
		if count != 0 {
			t.Fatal("reference-dependent state survived", table)
		}
	}
	if w = f.request(t, "POST", base+"/demo-jobs", payload); w.Code != 400 {
		t.Fatal("erased reference recreated", w.Code)
	}
	if !f.a.hasPermission(context.Background(), f.client) {
		t.Fatal("reference removal withdrew permission")
	}
}

// Test-only retained model files exercise ownership and transitive erasure, not
// native geometry. Actual Open3D processing is verified by the local CLI flow.
func completedComponentParent(t *testing.T, f privacyFixture, set PhotoSet) DemoJob {
	t.Helper()
	j := queueDemo(t, f, set)
	waitDemoJob(t, f, j.ID, "completed")
	if _, err := f.a.DB.Exec("UPDATE demo_jobs SET kind='fit',candidate='makehuman' WHERE run_id=$1", j.ID); err != nil {
		t.Fatal(err)
	}
	dir := f.a.demoJobDirectory(f.client, j.ID)
	if err := os.WriteFile(filepath.Join(dir, "head.glb"), []byte("glTF test-only fixture"), 0600); err != nil {
		t.Fatal(err)
	}
	return j
}
func TestComponentSourceOwnershipSnapshotAndErasure(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	set := demoCapture(t, f, false)
	parent := completedComponentParent(t, f, set)
	t.Setenv("LOCAL_DEMO_ROOT", t.TempDir())
	f.a.demoSlots <- struct{}{}
	f.a.demoSlots <- struct{}{}
	defer func() { <-f.a.demoSlots; <-f.a.demoSlots }()
	base := "/api/clients/" + f.client
	settings := componentDemoDefaults()
	settings.SourceRunID = parent.ID
	payload := map[string]any{"candidate": "open3d", "kind": "process", "minimumWidth": 512, "photoSetId": set.ID, "photoViews": set.Views, "component": settings}
	wrong := settings
	wrong.SourceRunID = newID()
	payload["component"] = wrong
	if w := f.request(t, "POST", base+"/demo-jobs", payload); w.Code != 400 {
		t.Fatal("unknown source accepted", w.Code, w.Body.String())
	}
	wrong = settings
	wrong.SamplePoints = 50001
	payload["component"] = wrong
	if w := f.request(t, "POST", base+"/demo-jobs", payload); w.Code != 400 {
		t.Fatal("unbounded point count accepted", w.Code)
	}
	payload["component"] = settings
	otherSet := demoCapture(t, f, false)
	payload["photoSetId"] = otherSet.ID
	payload["photoViews"] = otherSet.Views
	if w := f.request(t, "POST", base+"/demo-jobs", payload); w.Code != 400 {
		t.Fatal("different photo snapshot accepted", w.Code)
	}
	payload["photoSetId"] = set.ID
	payload["photoViews"] = set.Views
	foreignOrg := newID()
	f.a.DB.Exec("INSERT INTO organizations(id,name) VALUES($1,'foreign test studio')", foreignOrg)
	f.a.DB.Exec("UPDATE generation_runs SET organization_id=$1 WHERE id=$2", foreignOrg, parent.ID)
	if w := f.request(t, "POST", base+"/demo-jobs", payload); w.Code != 400 {
		t.Fatal("foreign studio source accepted", w.Code)
	}
	f.a.DB.Exec("UPDATE generation_runs SET organization_id=$1 WHERE id=$2", f.org, parent.ID)
	var originalAssets int
	f.a.DB.QueryRow("SELECT count(*) FROM assets WHERE client_id=$1", f.client).Scan(&originalAssets)
	w := f.request(t, "POST", base+"/demo-jobs", payload)
	if w.Code != 202 {
		t.Fatal(w.Code, w.Body.String())
	}
	child := responseRecord[DemoJob](t, w.Body.Bytes())
	if !f.a.demoRunAllowed(context.Background(), child.ID) {
		t.Fatal("valid dependent run denied")
	}
	// Retain a second generation as well, to test recursion rather than direct-only cleanup.
	f.a.DB.Exec("UPDATE generation_runs SET status='completed' WHERE id=$1", child.ID)
	childDir := f.a.demoJobDirectory(f.client, child.ID)
	os.MkdirAll(childDir, 0700)
	os.WriteFile(filepath.Join(childDir, "head.glb"), []byte("glTF test-only fixture"), 0600)
	// Export routing must preserve privacy and reject files outside the job.
	os.WriteFile(filepath.Join(childDir, "processed-skin.ply"), []byte("ply\ncomment test-only export\nend_header\n"), 0600)
	w = f.request(t, "GET", base+"/demo-jobs/"+child.ID+"/artifacts/geometry/processed-skin", nil)
	if w.Code != 200 || w.Header().Get("Cache-Control") != "private, no-store" || w.Header().Get("Content-Disposition") != "attachment; filename=\"processed-skin.ply\"" {
		t.Fatal("owned geometry export failed", w.Code, w.Header())
	}
	outside := filepath.Join(t.TempDir(), "private.ply")
	os.WriteFile(outside, []byte("private test content"), 0600)
	os.Symlink(outside, filepath.Join(childDir, "processed-points.ply"))
	if w = f.request(t, "GET", base+"/demo-jobs/"+child.ID+"/artifacts/geometry/filtered-cloud", nil); w.Code != 404 {
		t.Fatal("export symlink escaped job directory", w.Code)
	}
	settings.SourceRunID = child.ID
	payload["component"] = settings
	payload["candidate"] = "meshlab"
	w = f.request(t, "POST", base+"/demo-jobs", payload)
	if w.Code != 202 {
		t.Fatal(w.Code, w.Body.String())
	}
	grandchild := responseRecord[DemoJob](t, w.Body.Bytes())
	grandDir := f.a.demoJobDirectory(f.client, grandchild.ID)
	os.MkdirAll(grandDir, 0700)
	os.WriteFile(filepath.Join(grandDir, "private-copy"), []byte("test private dependent"), 0600)
	state := demoState(set.ID)
	state.Candidate = "open3d"
	state.ModelRunID = child.ID
	state.PhotoViews = set.Views
	state.Component = settings
	state.Component.SourceRunID = parent.ID
	if w = f.request(t, "PUT", base+"/demo-workspace", map[string]any{"state": state, "version": 0}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "POST", base+"/demo-options", map[string]any{"state": state, "title": "Dependent test option"}); w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	w = f.request(t, "POST", base+"/demo-jobs/"+parent.ID+"/cancel", nil)
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	for _, id := range []string{parent.ID, child.ID, grandchild.ID} {
		waitDemoJob(t, f, id, "cancelled")
		if _, err := os.Stat(f.a.demoJobDirectory(f.client, id)); !os.IsNotExist(err) {
			t.Fatal("dependent directory survived", id, err)
		}
		if f.a.demoRunAllowed(context.Background(), id) || f.a.publishNativeDemo(context.Background(), id, f.client, f.a.demoJobDirectory(f.client, id), nil) {
			t.Fatal("late dependent publication accepted", id)
		}
		if w = f.request(t, "GET", base+"/demo-jobs/"+id+"/artifacts/head/model", nil); w.Code != 404 {
			t.Fatal("deleted dependent served", id, w.Code)
		}
	}
	var count int
	f.a.DB.QueryRow("SELECT count(*) FROM assets WHERE client_id=$1", f.client).Scan(&count)
	if count != originalAssets {
		t.Fatal("experiment removal deleted source photos", count)
	}
	if !f.a.hasPermission(context.Background(), f.client) {
		t.Fatal("experiment removal withdrew permission")
	}
	f.a.DB.QueryRow("SELECT count(*) FROM demo_options WHERE client_id=$1", f.client).Scan(&count)
	if count != 0 {
		t.Fatal("dependent option survived")
	}
	f.a.DB.QueryRow("SELECT count(*) FROM demo_workspace_states WHERE client_id=$1", f.client).Scan(&count)
	if count != 0 {
		t.Fatal("dependent workspace survived")
	}
	payload["component"] = settings
	if w = f.request(t, "POST", base+"/demo-jobs", payload); w.Code != 400 {
		t.Fatal("deleted upstream recreated", w.Code)
	}
	var e erasureEvent
	raw, err := os.ReadFile(f.a.PrivacyLedgerPath)
	if err != nil {
		t.Fatal(err)
	}
	// Replaying the durable erasure after a simulated stale DB row/output is
	// specifically a tombstone check, not a backup or restore application flow.
	for _, line := range bytes.Split(bytes.TrimSpace(raw), []byte("\n")) {
		if err := json.Unmarshal(line, &e); err != nil {
			t.Fatal(err)
		}
	}
	f.a.DB.Exec("UPDATE generation_runs SET status='completed' WHERE id IN($1,$2,$3)", parent.ID, child.ID, grandchild.ID)
	if f.a.nativeParentsAvailable(context.Background(), parent.ID) || f.a.nativeParentsAvailable(context.Background(), child.ID) {
		t.Fatal("run tombstones allowed restored completed rows")
	}
	f.a.DB.Exec("UPDATE privacy_requests SET status='pending' WHERE id=$1", e.ID)
	os.MkdirAll(grandDir, 0700)
	os.WriteFile(filepath.Join(grandDir, "private-copy"), []byte("stale test copy"), 0600)
	if err := f.a.replayPrivacyLedger(context.Background()); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(grandDir); !os.IsNotExist(err) {
		t.Fatal("erased copy survived ledger replay")
	}
}
