package app

import (
	"testing"
	"time"
)

func outcomePhotoSet(t *testing.T, f privacyFixture, title string) PhotoSet {
	t.Helper()
	w := f.request(t, "POST", "/api/clients/"+f.client+"/photo-sets", map[string]string{"title": title})
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	s := responseRecord[PhotoSet](t, w.Body.Bytes())
	for _, view := range requiredPhotoViews {
		w = f.uploadPhoto(t, s.ID, view, "", diagnosticImage(t, "png"))
		if w.Code != 201 {
			t.Fatal(w.Code, w.Body.String())
		}
		s.Views[view] = responseRecord[Asset](t, w.Body.Bytes()).ID
	}
	return s
}

func TestOutcomeVisitSnapshotsSelectionHistoryAndPrivacy(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	base := "/api/clients/" + f.client
	baseline := demoCapture(t, f, false)
	actual := outcomePhotoSet(t, f, "Diagnostic actual set")
	consult := responseRecord[Consultation](t, f.request(t, "POST", base+"/consultations", consultationInput()).Body.Bytes())
	parent := completedComponentParent(t, f, baseline)
	// Diagnostic native fixture for consequential API invariants, not processing accuracy.
	if _, err := f.a.DB.Exec(`UPDATE demo_jobs SET result=json_set(result,'$.fit.basisVersion','makehuman-metre-z-up-v2','$.nativeShape.styleAttachment.version','makehuman-visible-lips-v2') WHERE run_id=$1`, parent.ID); err != nil {
		t.Fatal(err)
	}
	state := demoState(baseline.ID)
	state.Candidate = "makehuman"
	state.ModelRunID = parent.ID
	state.PhotoViews = baseline.Views
	w := f.request(t, "POST", base+"/demo-options", map[string]any{"title": "Diagnostic expected look", "state": state, "preview": testOptionPicture(t)})
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	first := responseRecord[DemoOption](t, w.Body.Bytes())
	selection := map[string]any{"consultationId": consult.ID, "optionId": first.ID, "version": 0, "rationale": "Synthetic diagnostic expected look", "professionalReviewed": true, "clientAgreed": true, "agreementName": "Fictional Test Client", "agreementMethod": "synthetic-demonstration"}
	w = f.request(t, "POST", base+"/expected-results", selection)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	event := responseRecord[ExpectedEvent](t, w.Body.Bytes())
	in := map[string]any{"consultationId": consult.ID, "kind": "post-cut", "title": "Simulated post-cut visit", "occurredOn": now().Format("2006-01-02"), "baselineSetId": baseline.ID, "actualSetId": actual.ID, "expectedVersion": 1, "requestId": newID(), "synthetic": true, "notes": "Diagnostic only; not a real haircut", "clientFeedback": "Fictional client feedback"}
	in["expectedVersion"] = 0
	if w = f.request(t, "POST", base+"/outcome-visits", in); w.Code != 409 {
		t.Fatal("stale expected selection accepted", w.Code, w.Body.String())
	}
	in["expectedVersion"] = 1
	in["synthetic"] = false
	if w = f.request(t, "POST", base+"/outcome-visits", in); w.Code != 400 {
		t.Fatal("unconfirmed actual outcome accepted", w.Code)
	}
	in["synthetic"] = true
	w = f.request(t, "POST", base+"/outcome-visits", in)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	visit := responseRecord[OutcomeVisit](t, w.Body.Bytes())
	if visit.ExpectedOptionID != first.ID || visit.ExpectedEventID != event.ID || visit.ExpectedVersion != 1 || visit.Views["baseline"]["front"] != baseline.Views["front"] || visit.Views["actual"]["front"] != actual.Views["front"] {
		t.Fatal("initial comparison snapshot incorrect", visit)
	}
	if w = f.request(t, "POST", base+"/outcome-visits", in); w.Code != 200 || responseRecord[OutcomeVisit](t, w.Body.Bytes()).ID != visit.ID {
		t.Fatal("lost-response retry duplicated visit", w.Code, w.Body.String())
	}
	in["notes"] = "Changed metadata with reused request"
	if w = f.request(t, "POST", base+"/outcome-visits", in); w.Code != 409 {
		t.Fatal("idempotency key changed immutable visit", w.Code)
	}
	in["notes"] = "Diagnostic only; not a real haircut"
	// Reassigning the source set and choosing another expected look do not rewrite the visit.
	w = f.uploadPhoto(t, baseline.ID, "front", baseline.Views["front"], diagnosticImage(t, "jpeg"))
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	replacement := responseRecord[Asset](t, w.Body.Bytes())
	state.RevisionNote = "Second diagnostic expected revision"
	w = f.request(t, "POST", base+"/demo-options", map[string]any{"title": "Second diagnostic look", "state": state, "parentId": first.ID, "preview": testOptionPicture(t)})
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	second := responseRecord[DemoOption](t, w.Body.Bytes())
	selection["optionId"] = second.ID
	selection["version"] = 1
	if w = f.request(t, "POST", base+"/expected-results", selection); w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "POST", base+"/outcome-visits", in); w.Code != 200 {
		t.Fatal("retry after target change lost original snapshot", w.Code, w.Body.String())
	}
	in["requestId"] = newID()
	in["kind"] = "follow-up"
	in["previousVisitId"] = visit.ID
	in["title"] = "Simulated later follow-up"
	in["expectedVersion"] = 2
	in["occurredOn"] = now().AddDate(0, 0, -1).Format("2006-01-02")
	if w = f.request(t, "POST", base+"/outcome-visits", in); w.Code != 400 {
		t.Fatal("follow-up predates linked visit", w.Code)
	}
	in["occurredOn"] = now().Format("2006-01-02")
	w = f.request(t, "POST", base+"/outcome-visits", in)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	follow := responseRecord[OutcomeVisit](t, w.Body.Bytes())
	if follow.PreviousVisitID != visit.ID || follow.ExpectedOptionID != second.ID || follow.Views["baseline"]["front"] != replacement.ID {
		t.Fatal("follow-up did not snapshot current evidence", follow)
	}
	reopened, err := Open(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	f.a = reopened
	w = f.request(t, "GET", base+"/outcome-visits", nil)
	if w.Code != 200 || w.Header().Get("Cache-Control") != "no-store" {
		t.Fatal(w.Code, w.Body.String())
	}
	loaded := responseRecord[[]OutcomeVisit](t, w.Body.Bytes())
	if len(loaded) != 2 {
		t.Fatal("reopen lost visits", loaded)
	}
	for _, v := range loaded {
		if v.ID == visit.ID && (v.ExpectedOptionID != first.ID || v.Views["baseline"]["front"] != baseline.Views["front"]) {
			t.Fatal("history rewritten", v)
		}
	}
	if w = f.request(t, "DELETE", "/api/assets/"+baseline.Views["front"], map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	loaded = responseRecord[[]OutcomeVisit](t, f.request(t, "GET", base+"/outcome-visits", nil).Body.Bytes())
	for _, v := range loaded {
		if v.ExpectedOptionID != "" || v.ExpectedEventID != "" {
			t.Fatal("erased native option left target media dependency", v)
		}
		if v.ID == visit.ID && v.Views["baseline"]["front"] != "" {
			t.Fatal("deleted baseline remains in comparison", v)
		}
		if v.Views["actual"]["front"] != actual.Views["front"] {
			t.Fatal("unrelated actual photo removed", v)
		}
	}
	if w = f.request(t, "POST", base+"/withdraw", map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	loaded = responseRecord[[]OutcomeVisit](t, f.request(t, "GET", base+"/outcome-visits", nil).Body.Bytes())
	for _, v := range loaded {
		if len(v.Views["baseline"])+len(v.Views["actual"]) != 0 {
			t.Fatal("withdrawal left comparison media", v)
		}
	}
	if w = f.request(t, "POST", base+"/outcome-visits", in); w.Code != 403 {
		t.Fatal("withdrawal allowed visit recreation", w.Code)
	}
	if w = f.request(t, "DELETE", base, map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	var count int
	if err = f.a.DB.QueryRow("SELECT count(*) FROM outcome_visits").Scan(&count); err != nil || count != 0 {
		t.Fatal("client erasure left visit records", count, err)
	}
}

func TestOutcomeVisitMissingCoverageAndStudioBoundary(t *testing.T) {
	f := newPrivacyFixture(t)
	base := "/api/clients/" + f.client
	f.acknowledge(t)
	baseline := outcomePhotoSet(t, f, "Diagnostic baseline")
	consult := responseRecord[Consultation](t, f.request(t, "POST", base+"/consultations", consultationInput()).Body.Bytes())
	actual := responseRecord[PhotoSet](t, f.request(t, "POST", base+"/photo-sets", map[string]string{"title": "Incomplete diagnostic actual"}).Body.Bytes())
	in := map[string]any{"consultationId": consult.ID, "kind": "post-cut", "title": "Diagnostic partial outcome", "occurredOn": now().Format("2006-01-02"), "baselineSetId": baseline.ID, "actualSetId": actual.ID, "expectedVersion": 0, "requestId": newID(), "actualConfirmed": true}
	if w := f.request(t, "POST", base+"/outcome-visits", in); w.Code != 400 {
		t.Fatal("empty actual accepted", w.Code, w.Body.String())
	}
	w := f.uploadPhoto(t, actual.ID, "front", "", diagnosticImage(t, "png"))
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	w = f.request(t, "POST", base+"/outcome-visits", in)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	v := responseRecord[OutcomeVisit](t, w.Body.Bytes())
	if len(v.Views["actual"]) != 1 || v.ExpectedOptionID != "" || v.ExpectedVersion != 0 {
		t.Fatal("missing evidence fabricated", v)
	}
	otherOrg, otherClient, otherSet := newID(), newID(), newID()
	for _, s := range []struct {
		sql  string
		args []any
	}{{"INSERT INTO organizations(id,name) VALUES($1,'Other studio')", []any{otherOrg}}, {"INSERT INTO clients(id,organization_id,name) VALUES($1,$2,'Other client')", []any{otherClient, otherOrg}}, {"INSERT INTO photo_sets(id,organization_id,client_id,title,created_at) VALUES($1,$2,$3,'Other set',$4)", []any{otherSet, otherOrg, otherClient, time.Now()}}} {
		if _, err := f.a.DB.Exec(s.sql, s.args...); err != nil {
			t.Fatal(err)
		}
	}
	in["requestId"] = newID()
	in["actualSetId"] = otherSet
	if w = f.request(t, "POST", base+"/outcome-visits", in); w.Code != 404 {
		t.Fatal("foreign set admitted", w.Code, w.Body.String())
	}
	if w = f.request(t, "GET", "/api/clients/"+otherClient+"/outcome-visits", nil); w.Code != 404 {
		t.Fatal("foreign visit access", w.Code)
	}
	anon := f
	anon.cookie = nil
	if w = anon.request(t, "GET", base+"/outcome-visits", nil); w.Code != 401 {
		t.Fatal("anonymous visit access", w.Code)
	}
}
