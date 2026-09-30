package app

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
)

func diagnosticImage(t *testing.T, format string) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, 24, 24))
	for y := 0; y < 24; y++ {
		for x := 0; x < 24; x++ {
			img.Set(x, y, color.RGBA{40, 100, 70, 255})
		}
	}
	var buf bytes.Buffer
	var err error
	if format == "jpeg" {
		err = jpeg.Encode(&buf, img, nil)
	} else {
		err = png.Encode(&buf, img)
	}
	if err != nil {
		t.Fatal(err)
	}
	return buf.Bytes()
}
func (f privacyFixture) uploadPhoto(t *testing.T, set, view, expected string, data []byte) *httptest.ResponseRecorder {
	t.Helper()
	var body bytes.Buffer
	form := multipart.NewWriter(&body)
	for k, v := range map[string]string{"photoSetId": set, "view": view, "expectedAssetId": expected} {
		if err := form.WriteField(k, v); err != nil {
			t.Fatal(err)
		}
	}
	file, err := form.CreateFormFile("image", "diagnostic.png")
	if err != nil {
		t.Fatal(err)
	}
	if _, err = file.Write(data); err != nil {
		t.Fatal(err)
	}
	if err = form.Close(); err != nil {
		t.Fatal(err)
	}
	r := httptest.NewRequest("POST", "/api/clients/"+f.client+"/assets", &body)
	r.Header.Set("Content-Type", form.FormDataContentType())
	r.AddCookie(f.cookie)
	w := httptest.NewRecorder()
	f.a.Handler().ServeHTTP(w, r)
	return w
}
func TestGuidedPhotoSetIncompleteReplaceReloadAndDeletion(t *testing.T) {
	f := newPrivacyFixture(t)
	path := "/api/clients/" + f.client + "/photo-sets"
	w := f.request(t, "POST", path, map[string]string{"title": "Diagnostic baseline"})
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	set := responseRecord[PhotoSet](t, w.Body.Bytes())
	if len(set.Missing) != 6 || len(set.Views) != 0 {
		t.Fatal("empty set incorrectly complete")
	}
	if w = f.uploadPhoto(t, set.ID, "front", "", diagnosticImage(t, "png")); w.Code != 403 {
		t.Fatal("upload allowed without permission")
	}
	f.acknowledge(t)
	w = f.uploadPhoto(t, set.ID, "front", "", diagnosticImage(t, "png"))
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	first := responseRecord[Asset](t, w.Body.Bytes())
	w = f.uploadPhoto(t, set.ID, "front", "", diagnosticImage(t, "jpeg"))
	if w.Code != 409 {
		t.Fatal("stale view overwritten", w.Code, w.Body.String())
	}
	w = f.uploadPhoto(t, set.ID, "front", first.ID, diagnosticImage(t, "jpeg"))
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	replacement := responseRecord[Asset](t, w.Body.Bytes())
	if w = f.request(t, "GET", "/api/assets/"+first.ID+"/content", nil); w.Code != 200 {
		t.Fatal("replacement destroyed earlier photo")
	}
	for _, view := range append(requiredPhotoViews[1:], "crown", "under-chin") {
		if w = f.uploadPhoto(t, set.ID, view, "", diagnosticImage(t, "png")); w.Code != 201 {
			t.Fatal(view, w.Code, w.Body.String())
		}
	}
	loaded := responseRecord[[]PhotoSet](t, f.request(t, "GET", path, nil).Body.Bytes())
	if len(loaded) != 1 || len(loaded[0].Missing) != 0 || len(loaded[0].Views) != 8 || loaded[0].Views["front"] != replacement.ID {
		t.Fatal("labeled set failed reload", loaded)
	}
	w = f.request(t, "PATCH", "/api/photo-sets/"+set.ID+"/views/back", map[string]string{"assetId": replacement.ID, "expectedAssetId": loaded[0].Views["back"]})
	if w.Code != 409 {
		t.Fatal("duplicate assignment silently accepted", w.Code)
	}
	w = f.request(t, "PATCH", "/api/photo-sets/"+set.ID+"/views/front", map[string]string{"assetId": "", "expectedAssetId": replacement.ID})
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "GET", "/api/assets/"+replacement.ID+"/content", nil); w.Code != 200 {
		t.Fatal("clearing a view destroyed the photo")
	}
	w = f.request(t, "PATCH", "/api/photo-sets/"+set.ID+"/views/front", map[string]string{"assetId": first.ID, "expectedAssetId": ""})
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "DELETE", "/api/assets/"+first.ID, map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	loaded = responseRecord[[]PhotoSet](t, f.request(t, "GET", path, nil).Body.Bytes())
	if len(loaded[0].Missing) != 1 || loaded[0].Missing[0] != "front" {
		t.Fatal("deleted view remained complete")
	}
	reopened, err := Open(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.Close()
	f.a = reopened
	loaded = responseRecord[[]PhotoSet](t, f.request(t, "GET", path, nil).Body.Bytes())
	if len(loaded[0].Views) != 7 {
		t.Fatal("photo labels lost on reopen")
	}
	if w = f.request(t, "POST", "/api/clients/"+f.client+"/withdraw", map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	loaded = responseRecord[[]PhotoSet](t, f.request(t, "GET", path, nil).Body.Bytes())
	if len(loaded[0].Views) != 0 || len(loaded[0].Missing) != 6 {
		t.Fatal("withdrawal left stale photo references")
	}
	if w = f.request(t, "DELETE", "/api/clients/"+f.client, map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	var count int
	if err = f.a.DB.QueryRow("SELECT count(*) FROM photo_sets").Scan(&count); err != nil || count != 0 {
		t.Fatal("client deletion left capture records", count, err)
	}
}
func TestPhotoInputFailureAndStudioIsolation(t *testing.T) {
	f := newPrivacyFixture(t)
	f.acknowledge(t)
	path := "/api/clients/" + f.client + "/photo-sets"
	set := responseRecord[PhotoSet](t, f.request(t, "POST", path, map[string]string{"title": "Diagnostic baseline"}).Body.Bytes())
	for _, data := range [][]byte{[]byte("not an image"), diagnosticImage(t, "png")[:30]} {
		if w := f.uploadPhoto(t, set.ID, "front", "", data); w.Code != 400 {
			t.Fatal("invalid image accepted", w.Code, w.Body.String())
		}
	}
	if w := f.uploadPhoto(t, set.ID, "wrong-view", "", diagnosticImage(t, "png")); w.Code != 400 {
		t.Fatal("invalid view accepted")
	}
	var count int
	if err := f.a.DB.QueryRow("SELECT count(*) FROM assets").Scan(&count); err != nil || count != 0 {
		t.Fatal("failed upload left metadata", count, err)
	}
	otherOrg, otherClient, otherSet, otherAsset := newID(), newID(), newID(), newID()
	for _, statement := range []struct {
		sql  string
		args []any
	}{{"INSERT INTO organizations(id,name) VALUES($1,'Other studio')", []any{otherOrg}}, {"INSERT INTO clients(id,organization_id,name) VALUES($1,$2,'Other client')", []any{otherClient, otherOrg}}, {"INSERT INTO photo_sets(id,organization_id,client_id,title,created_at) VALUES($1,$2,$3,'Other private set',$4)", []any{otherSet, otherOrg, otherClient, now()}}, {"INSERT INTO assets(id,organization_id,client_id,storage_key,content_type,kind) VALUES($1,$2,$3,$4,'image/png','source')", []any{otherAsset, otherOrg, otherClient, otherAsset}}} {
		if _, err := f.a.DB.Exec(statement.sql, statement.args...); err != nil {
			t.Fatal(err)
		}
	}
	if w := f.uploadPhoto(t, otherSet, "front", "", diagnosticImage(t, "png")); w.Code != 404 {
		t.Fatal("foreign set upload allowed")
	}
	if w := f.request(t, "PATCH", "/api/photo-sets/"+otherSet+"/views/front", map[string]string{"assetId": otherAsset}); w.Code != 404 {
		t.Fatal("foreign set assignment allowed")
	}
	if w := f.request(t, "PATCH", "/api/photo-sets/"+set.ID+"/views/front", map[string]string{"assetId": otherAsset}); w.Code != 404 {
		t.Fatal("foreign media assignment allowed")
	}
	if w := f.request(t, "GET", "/api/clients/"+otherClient+"/photo-sets", nil); w.Code != 404 {
		t.Fatal("foreign set list leaked")
	}
	foreign := f
	foreign.cookie = nil
	if w := foreign.request(t, "GET", path, nil); w.Code != http.StatusUnauthorized {
		t.Fatal("anonymous capture access")
	}
}
