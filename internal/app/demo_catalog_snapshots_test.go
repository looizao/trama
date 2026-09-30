package app

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestCatalogExpansionPreservesRetainedJobsAndRejectsUnexportedStyles(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	set := demoCapture(t, f, false)
	job := completedComponentParent(t, f, set)
	base := "/api/clients/" + f.client
	dir := f.a.demoJobDirectory(f.client, job.ID)
	if err := writeNativeCatalogSnapshot(dir, nil); err != nil {
		t.Fatal(err)
	}
	before, err := os.ReadFile(filepath.Join(dir, "style-catalog.json"))
	if err != nil {
		t.Fatal(err)
	}
	var old map[string]any
	var raw string
	f.a.DB.QueryRow("SELECT result FROM demo_jobs WHERE run_id=$1", job.ID).Scan(&raw)
	if err = json.Unmarshal([]byte(raw), &old); err != nil {
		t.Fatal(err)
	}
	old["head"] = "head.glb"
	path := filepath.Join(demoAssetRoot(), "hair-catalog.json")
	var catalog []map[string]any
	data, _ := os.ReadFile(path)
	if err = json.Unmarshal(data, &catalog); err != nil {
		t.Fatal(err)
	}
	newStyle := map[string]any{"id": "later-style", "label": "Later real catalog entry", "glb": "hair/later-style.glb", "render": "hair/later-style.png"}
	catalog = append(catalog, newStyle)
	if err = os.WriteFile(path, rawJSON(catalog), 0600); err != nil {
		t.Fatal(err)
	}
	// Even a stray file cannot be served unless this job actually enumerated it.
	os.WriteFile(filepath.Join(dir, "hair/later-style.glb"), []byte("glTF test-only unlisted bytes"), 0600)
	if w := f.request(t, "GET", base+"/demo-jobs/"+job.ID+"/artifacts/hair/sample", nil); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w := f.request(t, "GET", base+"/demo-jobs/"+job.ID+"/artifacts/hair/later-style", nil); w.Code != 404 {
		t.Fatal("unexported style served", w.Code)
	}
	state := demoState(set.ID)
	state.Candidate = "makehuman"
	state.ModelRunID = job.ID
	state.PhotoViews = set.Views
	if w := f.request(t, "POST", base+"/demo-options", map[string]any{"title": "Retained older option", "state": state}); w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	state.HairID = "later-style"
	if w := f.request(t, "POST", base+"/demo-options", map[string]any{"title": "Unavailable later style", "state": state}); w.Code != 400 {
		t.Fatal("unexported style selected", w.Code)
	}
	copyDir := t.TempDir()
	source, err := f.a.copyComponentModel(context.Background(), f.client, job.ID, copyDir, "upstream")
	if err != nil {
		t.Fatal(err)
	}
	if _, err = os.Stat(filepath.Join(copyDir, "upstream/hair/later-style.glb")); !os.IsNotExist(err) {
		t.Fatal("unlisted asset copied", err)
	}
	if err = writeNativeCatalogSnapshot(copyDir, source); err != nil {
		t.Fatal(err)
	}
	if after, _ := os.ReadFile(filepath.Join(dir, "style-catalog.json")); string(after) != string(before) {
		t.Fatal("old snapshot mutated")
	}
	if err = validateNativeArtifacts(dir, old); err != nil {
		t.Fatal("expanded global catalog invalidated actual old snapshot", err)
	}
	delete(old["hair"].(map[string]any), "sample")
	if err = validateNativeArtifacts(dir, old); err == nil {
		t.Fatal("missing snapshot asset accepted")
	}
}
