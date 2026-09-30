package app

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"image"
	"image/jpeg"
	"testing"
)

func testOptionPicture(t *testing.T) string {
	t.Helper()
	var b bytes.Buffer
	if err := jpeg.Encode(&b, image.NewRGBA(image.Rect(0, 0, 32, 32)), nil); err != nil {
		t.Fatal(err)
	}
	return "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(b.Bytes())
}
func TestExpectedSelectionLineageConcurrencyAndMediaErasure(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	set := demoCapture(t, f, false)
	parent := completedComponentParent(t, f, set)
	base := "/api/clients/" + f.client
	// This fixture tests API invariants only. It is not a processed client head.
	f.a.DB.Exec(`UPDATE demo_jobs SET result=json_set(result,'$.fit.basisVersion','makehuman-metre-z-up-v2','$.nativeShape.styleAttachment.version','makehuman-visible-lips-v2') WHERE run_id=$1`, parent.ID)
	w := f.request(t, "POST", base+"/consultations", consultationInput())
	visit := responseRecord[Consultation](t, w.Body.Bytes())
	state := demoState(set.ID)
	state.Candidate = "makehuman"
	state.ModelRunID = parent.ID
	state.PhotoViews = set.Views
	save := func(s DemoWorkspaceState, p string) DemoOption {
		t.Helper()
		w := f.request(t, "POST", base+"/demo-options", map[string]any{"title": "Test immutable proposal", "state": s, "parentId": p, "preview": testOptionPicture(t)})
		if w.Code != 201 {
			t.Fatal(w.Code, w.Body.String())
		}
		return responseRecord[DemoOption](t, w.Body.Bytes())
	}
	first := save(state, "")
	state.RevisionNote = "Second revision preserves the first"
	second := save(state, first.ID)
	if second.ParentID != first.ID || second.SeriesID != first.SeriesID || second.Revision != 2 {
		t.Fatal("lineage lost", first, second)
	}
	w = f.request(t, "GET", base+"/demo-options/"+first.ID+"/preview", nil)
	if w.Code != 200 || w.Header().Get("Cache-Control") != "private, no-store" {
		t.Fatal("private picture", w.Code)
	}
	wrongBase := "/api/clients/" + newID()
	for _, path := range []string{"/demo-options/" + first.ID + "/preview", "/expected-results"} {
		if w = f.request(t, "GET", wrongBase+path, nil); w.Code != 404 {
			t.Fatal("cross-client data exposed", w.Code)
		}
	}
	mutated := state
	mutated.RevisionNote = "Changed metadata cannot replace the original preview"
	if w = f.request(t, "PUT", base+"/demo-options/"+first.ID+"/preview", map[string]any{"state": mutated, "preview": testOptionPicture(t)}); w.Code != 409 {
		t.Fatal("mismatched preview accepted", w.Code)
	}
	if w = f.request(t, "PUT", base+"/demo-options/"+first.ID+"/preview", map[string]any{"state": first.State, "preview": testOptionPicture(t)}); w.Code != 409 {
		t.Fatal("immutable preview overwritten", w.Code)
	}
	input := map[string]any{"consultationId": visit.ID, "optionId": first.ID, "version": 0, "rationale": "Synthetic test chosen shape", "professionalReviewed": true, "clientAgreed": true, "agreementName": "Fictional Test Client", "agreementMethod": "synthetic-demonstration"}
	input["clientAgreed"] = false
	if w = f.request(t, "POST", base+"/expected-results", input); w.Code != 400 {
		t.Fatal("unagreed accepted", w.Code)
	}
	input["clientAgreed"] = true
	if w = f.request(t, "POST", base+"/expected-results", input); w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	input["optionId"] = second.ID
	if w = f.request(t, "POST", base+"/expected-results", input); w.Code != 409 {
		t.Fatal("stale selection accepted", w.Code)
	}
	input["version"] = 1
	if w = f.request(t, "POST", base+"/expected-results", input); w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	got := responseRecord[[]ExpectedResult](t, f.request(t, "GET", base+"/expected-results", nil).Body.Bytes())
	if len(got) != 1 || got[0].Version != 2 || len(got[0].History) != 2 || got[0].OptionID != second.ID || got[0].History[1].OptionID != first.ID {
		t.Fatal("history overwritten", got)
	}
	reopened, err := Open(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	f.a = reopened
	got = responseRecord[[]ExpectedResult](t, f.request(t, "GET", base+"/expected-results", nil).Body.Bytes())
	if got[0].OptionID != second.ID {
		t.Fatal("reload lost selection")
	}
	input["optionId"] = ""
	input["version"] = 2
	if w = f.request(t, "POST", base+"/expected-results", input); w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	got = responseRecord[[]ExpectedResult](t, f.request(t, "GET", base+"/expected-results", nil).Body.Bytes())
	if got[0].OptionID != "" || len(got[0].History) != 3 {
		t.Fatal("clear lost history")
	}
	input["optionId"] = second.ID
	input["version"] = 3
	f.request(t, "POST", base+"/expected-results", input)
	if w = f.request(t, "POST", base+"/demo-jobs/"+parent.ID+"/cancel", nil); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	got = responseRecord[[]ExpectedResult](t, f.request(t, "GET", base+"/expected-results", nil).Body.Bytes())
	if got[0].OptionID != "" || got[0].Version != 4 || len(got[0].History) != 1 || got[0].History[0].Action != "clear" {
		t.Fatal("dependent content survived or earlier selection resurrected", got)
	}
	var n int
	f.a.DB.QueryRow("SELECT count(*) FROM demo_option_previews").Scan(&n)
	if n != 0 {
		t.Fatal("derived pictures survived")
	}
	if w = f.request(t, "GET", base+"/demo-options/"+second.ID+"/preview", nil); w.Code != 404 {
		t.Fatal("deleted picture served")
	}
	input["version"] = 4
	if w = f.request(t, "POST", base+"/expected-results", input); w.Code != 404 {
		t.Fatal("deleted proposal selected")
	}
	if w = f.request(t, "POST", base+"/withdraw", map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code)
	}
	f.a.DB.QueryRow("SELECT count(*) FROM expected_selection_events").Scan(&n)
	if n != 0 {
		t.Fatal("withdrawn agreement notes survived")
	}
}

func TestExpectedRejectsHistoricalPrimaryAndReferenceThroughComponent(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	set := demoCapture(t, f, false)
	primary, reference, child := completedComponentParent(t, f, set), completedComponentParent(t, f, set), completedComponentParent(t, f, set)
	settings := componentDemoDefaults()
	settings.SourceRunID = primary.ID
	settings.ReferenceRunID = reference.ID
	raw, _ := json.Marshal(map[string]any{"component": settings})
	if _, err := f.a.DB.Exec("UPDATE demo_jobs SET candidate='cloudcompare',kind='process',settings=$1,result='{"+`"component":{"processingVersion":"cloudcompare-native-upstream-v2"}`+"}' WHERE run_id=$2", string(raw), child.ID); err != nil {
		t.Fatal(err)
	}
	f.a.DB.Exec("INSERT INTO demo_job_sources(run_id,source_run_id) VALUES($1,$2)", child.ID, primary.ID)
	f.a.DB.Exec("INSERT INTO demo_job_references(run_id,source_run_id) VALUES($1,$2)", child.ID, reference.ID)
	f.a.DB.Exec(`UPDATE demo_jobs SET result=json_set(result,'$.fit.basisVersion','makehuman-metre-z-up-v2','$.nativeShape.styleAttachment.version','makehuman-visible-lips-v2') WHERE run_id IN ($1,$2)`, primary.ID, reference.ID)
	base := "/api/clients/" + f.client
	visit := responseRecord[Consultation](t, f.request(t, "POST", base+"/consultations", consultationInput()).Body.Bytes())
	state := demoState(set.ID)
	state.Candidate = "cloudcompare"
	state.ModelRunID = child.ID
	state.PhotoViews = set.Views
	state.Component = settings
	w := f.request(t, "POST", base+"/demo-options", map[string]any{"title": "Supporting output fixture only", "state": state})
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	o := responseRecord[DemoOption](t, w.Body.Bytes())
	input := map[string]any{"consultationId": visit.ID, "optionId": o.ID, "version": 0, "rationale": "Fixture client agreement", "professionalReviewed": true, "clientAgreed": true, "agreementName": "Fictional Test Client", "agreementMethod": "synthetic-demonstration"}
	// The comparison reference contributes geometry diagnostics, not the styles
	// shown on the primary head. Only the actual style source needs lip attachment.
	f.a.DB.Exec(`UPDATE demo_jobs SET result=json_remove(result,'$.nativeShape.styleAttachment') WHERE run_id=$1`, reference.ID)
	f.a.DB.Exec(`UPDATE demo_jobs SET result=json_remove(result,'$.nativeShape.styleAttachment') WHERE run_id=$1`, primary.ID)
	if w = f.request(t, "POST", base+"/expected-results", input); w.Code != 400 || !bytes.Contains(w.Body.Bytes(), []byte("beard placement")) {
		t.Fatal("broken primary beard attachment accepted", w.Code, w.Body.String())
	}
	f.a.DB.Exec(`UPDATE demo_jobs SET result=json_set(result,'$.nativeShape.styleAttachment.version','makehuman-visible-lips-v2') WHERE run_id=$1`, primary.ID)
	for _, id := range []string{primary.ID, reference.ID} {
		f.a.DB.Exec(`UPDATE demo_jobs SET result=json_set(result,'$.fit.basisVersion','historical-fit') WHERE run_id=$1`, id)
		if w = f.request(t, "POST", base+"/expected-results", input); w.Code != 400 {
			t.Fatal("historical dependency accepted", id, w.Code, w.Body.String())
		}
		f.a.DB.Exec(`UPDATE demo_jobs SET result=json_set(result,'$.fit.basisVersion','makehuman-metre-z-up-v2') WHERE run_id=$1`, id)
	}
	if w = f.request(t, "POST", base+"/expected-results", input); w.Code != 201 {
		t.Fatal("corrected chain denied", w.Code, w.Body.String())
	}
}
func TestExpectedRejectsMannequinHistoricalFitAndForeignVisit(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	base := "/api/clients/" + f.client
	visit := responseRecord[Consultation](t, f.request(t, "POST", base+"/consultations", consultationInput()).Body.Bytes())
	state := demoState("")
	o := responseRecord[DemoOption](t, f.request(t, "POST", base+"/demo-options", map[string]any{"title": "Mannequin only reference", "state": state}).Body.Bytes())
	input := map[string]any{"consultationId": visit.ID, "optionId": o.ID, "version": 0, "rationale": "Test chosen shape", "professionalReviewed": true, "clientAgreed": true, "agreementName": "Fictional Test Client", "agreementMethod": "professional-recorded"}
	if w := f.request(t, "POST", base+"/expected-results", input); w.Code != 400 {
		t.Fatal("mannequin selected", w.Code)
	}
	input["consultationId"] = newID()
	if w := f.request(t, "POST", base+"/expected-results", input); w.Code != 404 {
		t.Fatal("foreign consultation accepted", w.Code)
	}
	set := demoCapture(t, f, false)
	p := completedComponentParent(t, f, set)
	state.Candidate = "makehuman"
	state.PhotoSetID = set.ID
	state.PhotoViews = set.Views
	state.ModelRunID = p.ID
	o = responseRecord[DemoOption](t, f.request(t, "POST", base+"/demo-options", map[string]any{"title": "Historical fit fixture", "state": state}).Body.Bytes())
	input["optionId"] = o.ID
	input["consultationId"] = visit.ID
	if w := f.request(t, "POST", base+"/expected-results", input); w.Code != 400 {
		t.Fatal("historical fit accepted", w.Code)
	}
	for _, p := range []string{"data:image/png;base64,invalid", "data:image/jpeg;base64,invalid"} {
		if _, err := decodeOptionPicture(p); err == nil {
			t.Fatal("invalid picture")
		}
	}
}
