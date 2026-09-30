package app

import (
	"math"
	"net/http"
	"reflect"
	"testing"
	"time"
)

func TestWrittenRefinementAtomicUnitsAndUnsupportedRequests(t *testing.T) {
	original := defaultDemoRefinement()
	next, changes, err := interpretRefinement("shorter hair; more crown volume; narrower beard; beard color brown", original)
	if err != nil || len(changes) != 4 || next.Hair.LengthPercent != 85 || next.Hair.VolumeMM != 8 || next.Beard.WidthPercent != 90 || next.Beard.Color != "brown" || !reflect.DeepEqual(original, defaultDemoRefinement()) {
		t.Fatal(next, changes, err)
	}
	for _, text := range []string{"hair length 85", "hair length 200%", "beard volume NaNmm", "shorter hair; remove nose", "make me look like another person", "hair color 40", "barba mais curta; photorealistic haircut", ""} {
		got, _, err := interpretRefinement(text, original)
		if err == nil || !reflect.DeepEqual(got, original) {
			t.Fatal("unsupported or partial mutation", text, got, err)
		}
	}
	pt, _, err := interpretRefinement("cabelo mais curto; mais volume no topo; barba mais estreita", original)
	if err != nil || pt.Hair.LengthPercent != 85 || pt.Hair.VolumeMM != 8 || pt.Beard.WidthPercent != 90 {
		t.Fatal(pt, err)
	}
}
func TestBrushBounds(t *testing.T) {
	e := defaultDemoRefinement()
	e.Strokes = []DemoBrushStroke{{Kind: "hair", Center: [3]float64{0, .18, .07}, Normal: [3]float64{0, 1, 0}, RadiusMM: 20, StrengthMM: 3}}
	if e.validate() != "" {
		t.Fatal(e.validate())
	}
	for _, edit := range []func(*DemoBrushStroke){func(s *DemoBrushStroke) { s.Kind = "head" }, func(s *DemoBrushStroke) { s.Center[0] = math.Inf(1) }, func(s *DemoBrushStroke) { s.Normal = [3]float64{0, 0, 0} }, func(s *DemoBrushStroke) { s.RadiusMM = 51 }, func(s *DemoBrushStroke) { s.StrengthMM = 11 }} {
		bad := defaultDemoRefinement()
		bad.Strokes = append([]DemoBrushStroke{}, e.Strokes...)
		edit(&bad.Strokes[0])
		if bad.validate() == "" {
			t.Fatal("invalid stroke accepted", bad)
		}
	}
}
func TestRefinementAuthorizationRevisionPersistenceAndErasure(t *testing.T) {
	f := demoFixture(t)
	f.acknowledge(t)
	set := demoCapture(t, f, false)
	parent := completedComponentParent(t, f, set)
	base := "/api/clients/" + f.client
	state := demoState(set.ID)
	state.Candidate = "makehuman"
	state.PhotoViews = set.Views
	state.ModelRunID = parent.ID
	state.HairID = "sample"
	w := f.request(t, "POST", base+"/demo-refinements", map[string]any{"state": state, "request": "shorter hair; narrower beard"})
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	result := responseRecord[struct{ State DemoWorkspaceState }](t, w.Body.Bytes()).State
	if result.Refinement.Hair.LengthPercent != 85 || result.Refinement.Beard.WidthPercent != 90 {
		t.Fatal(result)
	}
	result.Refinement.Strokes = []DemoBrushStroke{{Kind: "beard", Center: [3]float64{0, -.07, .07}, Normal: [3]float64{0, 0, 1}, RadiusMM: 20, StrengthMM: -3}}
	for _, s := range []DemoWorkspaceState{state, result} {
		if w = f.request(t, "POST", base+"/demo-options", map[string]any{"state": s, "title": "Immutable revision fixture"}); w.Code != 201 {
			t.Fatal(w.Code, w.Body.String())
		}
	}
	got := responseRecord[[]DemoOption](t, f.request(t, "GET", base+"/demo-options", nil).Body.Bytes())
	if len(got) != 2 {
		t.Fatal("earlier revision overwritten")
	}
	var saved *DemoRefinement
	for _, o := range got {
		if o.State.Refinement != nil {
			saved = o.State.Refinement
		}
	}
	if !reflect.DeepEqual(saved, result.Refinement) {
		t.Fatal("edit recipe changed across reload", saved, result.Refinement)
	}
	anonymous := f
	anonymous.cookie = nil
	if w = anonymous.request(t, "POST", base+"/demo-refinements", map[string]any{"state": result, "request": "longer hair"}); w.Code != 401 {
		t.Fatal("anonymous refinement accepted", w.Code)
	}
	foreign := f
	other, user := newID(), newID()
	if _, err := f.a.DB.Exec("INSERT INTO organizations(id,name) VALUES($1,'Other refinement test studio')", other); err != nil {
		t.Fatal(err)
	}
	if _, err := f.a.DB.Exec("INSERT INTO users(id,organization_id,email,name,password_hash,role) VALUES($1,$2,'other-edit@example.test','Other','unused','professional')", user, other); err != nil {
		t.Fatal(err)
	}
	token, digest, _ := newSessionToken()
	if _, err := f.a.DB.Exec("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)", digest, user, now().Add(time.Hour)); err != nil {
		t.Fatal(err)
	}
	foreign.cookie = &http.Cookie{Name: sessionCookie, Value: token}
	if w = foreign.request(t, "POST", base+"/demo-refinements", map[string]any{"state": result, "request": "longer hair"}); w.Code != 404 {
		t.Fatal("foreign studio accepted", w.Code)
	}
	if w = f.request(t, "POST", base+"/demo-jobs/"+parent.ID+"/cancel", nil); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if got = responseRecord[[]DemoOption](t, f.request(t, "GET", base+"/demo-options", nil).Body.Bytes()); len(got) != 0 {
		t.Fatal("source erasure retained revisions")
	}
	if w = f.request(t, "POST", base+"/demo-refinements", map[string]any{"state": result, "request": "longer hair"}); w.Code != 400 {
		t.Fatal("erased source refined", w.Code)
	}
}
