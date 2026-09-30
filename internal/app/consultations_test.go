package app

import (
	"encoding/json"
	"net/http"
	"testing"
	"time"
)

func responseRecord[T any](t *testing.T, body []byte) T {
	t.Helper()
	var x T
	if err := json.Unmarshal(body, &x); err != nil {
		t.Fatal(err)
	}
	return x
}
func consultationInput() map[string]any {
	return map[string]any{"title": "Fictional initial visit", "fields": ConsultationFields{Goal: "A softer outline", Maintenance: "low"}, "answers": map[string]string{}}
}
func TestConsultationRequiredFieldsAndRevisionHistory(t *testing.T) {
	f := newPrivacyFixture(t)
	path := "/api/clients/" + f.client + "/consultations"
	for _, fields := range []ConsultationFields{{Maintenance: "low"}, {Goal: "Goal"}, {Goal: "Goal", Maintenance: "invalid"}, {Goal: "   ", Maintenance: "low"}} {
		in := consultationInput()
		in["fields"] = fields
		if w := f.request(t, "POST", path, in); w.Code != 400 {
			t.Fatal("incomplete consultation accepted", w.Code, w.Body.String())
		}
	}
	in := consultationInput()
	w := f.request(t, "POST", path, in)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	first := responseRecord[Consultation](t, w.Body.Bytes())
	in["revisesId"] = first.ID
	in["fields"] = ConsultationFields{Goal: "Updated softer outline", Maintenance: "moderate", Observations: "Optional curl pattern"}
	w = f.request(t, "POST", path, in)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	second := responseRecord[Consultation](t, w.Body.Bytes())
	if second.SeriesID != first.SeriesID || second.Revision != 2 {
		t.Fatal("revision lineage lost")
	}
	if w = f.request(t, "POST", path, in); w.Code != 409 {
		t.Fatal("stale revision accepted", w.Code, w.Body.String())
	}
	w = f.request(t, "GET", path, nil)
	if w.Code != 200 {
		t.Fatal(w.Code)
	}
	items := responseRecord[[]Consultation](t, w.Body.Bytes())
	if len(items) != 2 || items[1].Fields.Goal != "A softer outline" {
		t.Fatal("original consultation overwritten", items)
	}
	reopened, err := Open(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	f.a = reopened
	if items = responseRecord[[]Consultation](t, f.request(t, "GET", path, nil).Body.Bytes()); len(items) != 2 {
		t.Fatal("history lost after reopen")
	}
	if w = f.request(t, "POST", "/api/clients/"+f.client+"/withdraw", map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if items = responseRecord[[]Consultation](t, f.request(t, "GET", path, nil).Body.Bytes()); len(items) != 2 {
		t.Fatal("withdrawal erased non-media consultation")
	}
	if w = f.request(t, "DELETE", "/api/clients/"+f.client, map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	var n int
	if err = reopened.DB.QueryRow("SELECT count(*) FROM consultations").Scan(&n); err != nil || n != 0 {
		t.Fatal("client deletion left consultation contents", n, err)
	}
}
func TestReusableTemplateSnapshotAndArchive(t *testing.T) {
	f := newPrivacyFixture(t)
	tpl := map[string]any{"name": "General styling intake", "questions": []IntakeQuestion{{ID: "styling", Label: "What styling tools do you use?", Required: true}}}
	w := f.request(t, "POST", "/api/intake-templates", tpl)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	template := responseRecord[IntakeTemplate](t, w.Body.Bytes())
	path := "/api/clients/" + f.client + "/consultations"
	in := consultationInput()
	in["templateId"] = template.ID
	in["templateVersion"] = template.Version
	if w = f.request(t, "POST", path, in); w.Code != 400 {
		t.Fatal("required custom answer ignored", w.Code)
	}
	in["answers"] = map[string]string{"styling": "A brush"}
	w = f.request(t, "POST", path, in)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	first := responseRecord[Consultation](t, w.Body.Bytes())
	tpl["version"] = 1
	tpl["questions"] = []IntakeQuestion{{ID: "products", Label: "What products do you prefer?"}}
	w = f.request(t, "PATCH", "/api/intake-templates/"+template.ID, tpl)
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "PATCH", "/api/intake-templates/"+template.ID, tpl); w.Code != 409 {
		t.Fatal("stale template overwritten", w.Code)
	}
	if w = f.request(t, "POST", path, in); w.Code != 409 {
		t.Fatal("stale intake silently changed", w.Code)
	}
	in["templateId"] = ""
	in["revisesId"] = first.ID
	w = f.request(t, "POST", path, in)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	revision := responseRecord[Consultation](t, w.Body.Bytes())
	if revision.Template.Version != 1 || revision.Template.Questions[0].ID != "styling" || revision.Answers["styling"] != "A brush" {
		t.Fatal("original template snapshot lost")
	}
	tpl["version"] = 2
	tpl["archived"] = true
	if w = f.request(t, "PATCH", "/api/intake-templates/"+template.ID, tpl); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	delete(in, "revisesId")
	in["templateId"] = template.ID
	in["templateVersion"] = 3
	in["answers"] = map[string]string{}
	if w = f.request(t, "POST", path, in); w.Code != 404 {
		t.Fatal("archived template started intake", w.Code)
	}
	tpl["questions"] = []IntakeQuestion{{ID: "duplicate", Label: "Label"}, {ID: "duplicate", Label: "Another label"}}
	if w = f.request(t, "POST", "/api/intake-templates", tpl); w.Code != 400 {
		t.Fatal("duplicate question keys accepted")
	}
}
func TestConsultationStudioBoundaries(t *testing.T) {
	f := newPrivacyFixture(t)
	tpl := map[string]any{"name": "Private studio template", "questions": []IntakeQuestion{}}
	template := responseRecord[IntakeTemplate](t, f.request(t, "POST", "/api/intake-templates", tpl).Body.Bytes())
	path := "/api/clients/" + f.client + "/consultations"
	first := responseRecord[Consultation](t, f.request(t, "POST", path, consultationInput()).Body.Bytes())
	org, user := newID(), newID()
	if _, err := f.a.DB.Exec("INSERT INTO organizations(id,name) VALUES($1,'Other fictional studio')", org); err != nil {
		t.Fatal(err)
	}
	if _, err := f.a.DB.Exec("INSERT INTO users(id,organization_id,email,name,password_hash,role) VALUES($1,$2,'consultation-other@example.test','Other','unused','professional')", user, org); err != nil {
		t.Fatal(err)
	}
	token, digest, err := newSessionToken()
	if err != nil {
		t.Fatal(err)
	}
	if _, err = f.a.DB.Exec("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)", digest, user, now().Add(time.Hour)); err != nil {
		t.Fatal(err)
	}
	foreign := f
	foreign.cookie = &http.Cookie{Name: sessionCookie, Value: token}
	if w := foreign.request(t, "GET", path, nil); w.Code != 404 {
		t.Fatal("cross-studio consultation read")
	}
	if w := foreign.request(t, "POST", path, consultationInput()); w.Code != 404 {
		t.Fatal("cross-studio consultation create")
	}
	tpl["version"] = 1
	if w := foreign.request(t, "PATCH", "/api/intake-templates/"+template.ID, tpl); w.Code != 404 {
		t.Fatal("cross-studio template edit")
	}
	list := responseRecord[[]IntakeTemplate](t, foreign.request(t, "GET", "/api/intake-templates", nil).Body.Bytes())
	if len(list) != 0 {
		t.Fatal("cross-studio template list")
	}
	otherClient := newID()
	if _, err = f.a.DB.Exec("INSERT INTO clients(id,organization_id,name) VALUES($1,$2,'Other client')", otherClient, org); err != nil {
		t.Fatal(err)
	}
	in := consultationInput()
	in["revisesId"] = first.ID
	if w := foreign.request(t, "POST", "/api/clients/"+otherClient+"/consultations", in); w.Code != 404 {
		t.Fatal("cross-studio consultation revise")
	}
	delete(in, "revisesId")
	in["templateId"] = template.ID
	in["templateVersion"] = 1
	if w := foreign.request(t, "POST", "/api/clients/"+otherClient+"/consultations", in); w.Code != 404 {
		t.Fatal("cross-studio template use")
	}
	foreign.cookie = nil
	if w := foreign.request(t, "GET", "/api/intake-templates", nil); w.Code != 401 {
		t.Fatal("anonymous template access")
	}
}
