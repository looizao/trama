package app

import (
	"context"
	"testing"
)

func TestMaintenancePlanHistoryAndErasure(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	base := "/api/clients/" + f.client
	capture := demoCapture(t, f, false)
	consult := responseRecord[Consultation](t, f.request(t, "POST", base+"/consultations", consultationInput()).Body.Bytes())
	parent := completedComponentParent(t, f, capture)
	if _, err := f.a.DB.Exec(`UPDATE demo_jobs SET result=json_set(result,'$.fit.basisVersion','makehuman-metre-z-up-v2','$.nativeShape.styleAttachment.version','makehuman-visible-lips-v2') WHERE run_id=$1`, parent.ID); err != nil {
		t.Fatal(err)
	}
	state := demoState(capture.ID)
	state.Candidate = "makehuman"
	state.ModelRunID = parent.ID
	state.PhotoViews = capture.Views
	w := f.request(t, "POST", base+"/demo-options", map[string]any{"title": "Diagnostic stage option", "state": state, "preview": testOptionPicture(t)})
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	option := responseRecord[DemoOption](t, w.Body.Bytes())
	selection := map[string]any{"consultationId": consult.ID, "optionId": option.ID, "version": 0, "rationale": "Synthetic diagnostic selected look", "professionalReviewed": true, "clientAgreed": true, "agreementName": "Fictional Test Client", "agreementMethod": "synthetic-demonstration"}
	if w = f.request(t, "POST", base+"/expected-results", selection); w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	event := responseRecord[ExpectedEvent](t, w.Body.Bytes())
	guidance := MaintenanceGuidance{DailyMinutes: 5, Washing: "Diagnostic care routine", HairSteps: []string{"Comb gently"}, BeardSteps: []string{"Review beard outline"}, Products: []string{"Light hold category"}, TrimDays: 28, CheckInDays: 28, Feasibility: "Diagnostic feasibility notes; no professional claim"}
	stages := []GrowthStage{{Weeks: 0, Title: "Immediate reference", Instructions: "Discuss the achievable present outline", OptionID: option.ID}, {Weeks: 4, Title: "Later checkpoint", Instructions: "Assess actual growth, do not promise it", OptionID: option.ID}}
	in := map[string]any{"consultationId": consult.ID, "title": "Diagnostic staged plan", "startsOn": "2026-09-01", "guidance": guidance, "stages": stages, "expectedVersion": 0, "requestId": newID(), "synthetic": true}
	if w = f.request(t, "POST", base+"/maintenance-plans", in); w.Code != 400 {
		t.Fatal("missing expected accepted", w.Code)
	}
	in["expectedVersion"] = 2
	if w = f.request(t, "POST", base+"/maintenance-plans", in); w.Code != 409 {
		t.Fatal("stale expected accepted", w.Code)
	}
	in["expectedVersion"] = 1
	in["synthetic"] = false
	in["professionalReviewed"] = true
	if w = f.request(t, "POST", base+"/maintenance-plans", in); w.Code != 400 {
		t.Fatal("synthetic target mislabeled", w.Code)
	}
	in["synthetic"] = true
	stages[0].Weeks = 2
	if w = f.request(t, "POST", base+"/maintenance-plans", in); w.Code != 400 {
		t.Fatal("nonzero initial stage accepted", w.Code)
	}
	stages[0].Weeks = 0
	stages[1].OutcomeVisitID = newID()
	if w = f.request(t, "POST", base+"/maintenance-plans", in); w.Code != 404 {
		t.Fatal("foreign visit admitted")
	}
	stages[1].OutcomeVisitID = ""
	stages[1].OptionID = newID()
	if w = f.request(t, "POST", base+"/maintenance-plans", in); w.Code != 404 {
		t.Fatal("foreign stage option admitted")
	}
	stages[1].OptionID = option.ID
	w = f.request(t, "POST", base+"/maintenance-plans", in)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	first := responseRecord[MaintenancePlan](t, w.Body.Bytes())
	if first.ExpectedOptionID != option.ID || first.ExpectedEventID != event.ID || first.ExpectedVersion != 1 || first.Revision != 1 || len(first.Stages) != 2 {
		t.Fatal("initial snapshot incorrect", first)
	}
	if w = f.request(t, "POST", base+"/maintenance-plans", in); w.Code != 200 || responseRecord[MaintenancePlan](t, w.Body.Bytes()).ID != first.ID {
		t.Fatal("idempotency failed", w.Code)
	}
	in["title"] = "Mutated request"
	if w = f.request(t, "POST", base+"/maintenance-plans", in); w.Code != 409 {
		t.Fatal("same request overwrote plan")
	}
	in["title"] = "Diagnostic revised plan"
	in["requestId"] = newID()
	in["parentId"] = first.ID
	guidance.DailyMinutes = 3
	in["guidance"] = guidance
	w = f.request(t, "POST", base+"/maintenance-plans", in)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	second := responseRecord[MaintenancePlan](t, w.Body.Bytes())
	if second.SeriesID != first.SeriesID || second.Revision != 2 {
		t.Fatal("revision not linked")
	}
	in["requestId"] = newID()
	if w = f.request(t, "POST", base+"/maintenance-plans", in); w.Code != 409 {
		t.Fatal("old revision branched history")
	}
	f.a.Close()
	reopened, err := Open(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(reopened.Close)
	f.a = reopened
	w = f.request(t, "GET", base+"/maintenance-plans", nil)
	if w.Code != 200 || w.Header().Get("Cache-Control") != "no-store" {
		t.Fatal("restart failed", w.Code)
	}
	plans := responseRecord[[]MaintenancePlan](t, w.Body.Bytes())
	if len(plans) != 2 || plans[0].Guidance.DailyMinutes != 3 || plans[1].Guidance.DailyMinutes != 5 {
		t.Fatal("history lost", plans)
	}
	if w = f.request(t, "DELETE", "/api/assets/"+capture.Views["front"], map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	plans = responseRecord[[]MaintenancePlan](t, f.request(t, "GET", base+"/maintenance-plans", nil).Body.Bytes())
	for _, p := range plans {
		if p.ExpectedOptionID != "" || p.ExpectedEventID != "" {
			t.Fatal("deleted expected target retained")
		}
		for _, s := range p.Stages {
			if s.OptionID != "" {
				t.Fatal("deleted stage media retained")
			}
		}
	}
	in["parentId"] = second.ID
	if w = f.request(t, "POST", base+"/maintenance-plans", in); w.Code != 409 {
		t.Fatal("deleted target recreated")
	}
	anon := f
	anon.cookie = nil
	if w = anon.request(t, "GET", base+"/maintenance-plans", nil); w.Code != 401 {
		t.Fatal("anonymous plan access")
	}
	if w = f.request(t, "POST", base+"/withdraw", map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code)
	}
	if w = f.request(t, "POST", base+"/maintenance-plans", in); w.Code != 403 {
		t.Fatal("withdrawn plan recreation")
	}
	if w = f.request(t, "DELETE", base, map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code)
	}
	var count int
	for _, table := range []string{"maintenance_plans", "growth_plan_stages"} {
		f.a.DB.QueryRow("SELECT count(*) FROM " + table).Scan(&count)
		if count != 0 {
			t.Fatal("plan survives client erase", table)
		}
	}
}
