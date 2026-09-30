package app

import (
	"testing"
)

func TestPrivateStyleReferencesRequireRightsAndFollowSourceErasure(t *testing.T) {
	f := demoFixture(t)
	base := "/api/clients/" + f.client
	input := map[string]any{"kind": "hair", "styleId": "sample", "title": "Synthetic licensed reference", "creator": "Fictional Studio", "license": "professional-owned", "rightsConfirmed": true, "notes": "Behavior fixture only"}
	if w := f.request(t, "POST", base+"/style-references", input); w.Code != 403 {
		t.Fatal("reference accepted without permission", w.Code)
	}
	f.acknowledge(t)
	asset, _ := f.asset(t, "")
	input["assetId"] = asset
	input["rightsConfirmed"] = false
	if w := f.request(t, "POST", base+"/style-references", input); w.Code != 400 {
		t.Fatal("missing affirmative rights accepted", w.Code)
	}
	input["rightsConfirmed"] = true
	input["license"] = "CC0-1.0"
	if w := f.request(t, "POST", base+"/style-references", input); w.Code != 400 {
		t.Fatal("missing licensed source accepted", w.Code)
	}
	input["sourceUrl"] = "javascript:alert(1)"
	if w := f.request(t, "POST", base+"/style-references", input); w.Code != 400 {
		t.Fatal("unsafe source accepted", w.Code)
	}
	input["sourceUrl"] = "https://example.test/licensed-fixture"
	w := f.request(t, "POST", base+"/style-references", input)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	s := responseRecord[StyleReference](t, w.Body.Bytes())
	if list := responseRecord[[]StyleReference](t, f.request(t, "GET", base+"/style-references", nil).Body.Bytes()); len(list) != 1 || list[0].ID != s.ID {
		t.Fatal("reference did not persist")
	}
	org := newID()
	f.a.DB.Exec("INSERT INTO organizations(id,name) VALUES($1,'Other test studio')", org)
	f.a.DB.Exec("UPDATE users SET organization_id=$1 WHERE id=$2", org, f.user)
	if w = f.request(t, "GET", base+"/style-references", nil); w.Code != 404 {
		t.Fatal("reference crossed studio boundary", w.Code)
	}
	if w = f.request(t, "DELETE", "/api/style-references/"+s.ID, nil); w.Code != 404 {
		t.Fatal("foreign reference removed", w.Code)
	}
	f.a.DB.Exec("UPDATE users SET organization_id=$1 WHERE id=$2", f.org, f.user)
	if w = f.request(t, "DELETE", "/api/assets/"+asset, map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if list := responseRecord[[]StyleReference](t, f.request(t, "GET", base+"/style-references", nil).Body.Bytes()); len(list) != 0 {
		t.Fatal("erased source reference survived")
	}
	if w = f.request(t, "POST", base+"/style-references", input); w.Code != 404 {
		t.Fatal("reference recreated from erased source", w.Code)
	}
	asset, _ = f.asset(t, "")
	input["assetId"] = asset
	if w = f.request(t, "POST", base+"/style-references", input); w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "POST", base+"/withdraw", map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	var count int
	f.a.DB.QueryRow("SELECT count(*) FROM style_references").Scan(&count)
	if count != 0 {
		t.Fatal("withdrawal retained dependent references")
	}
	if w = f.request(t, "POST", base+"/style-references", input); w.Code != 403 {
		t.Fatal("withdrawn reference recreated", w.Code)
	}
	f.cookie = nil
	if w = f.request(t, "GET", base+"/style-references", nil); w.Code != 401 {
		t.Fatal("anonymous references served", w.Code)
	}
}
