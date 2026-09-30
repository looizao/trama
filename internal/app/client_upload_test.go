package app

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"image"
	"image/png"
	"mime/multipart"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func uploadPortalRequest(t *testing.T, f privacyFixture, token, method, path string, body any) *httptest.ResponseRecorder {
	t.Helper()
	r := httptest.NewRequest(method, "/api/client-upload"+path, bytes.NewReader(rawJSON(body)))
	r.Header.Set("Authorization", "Bearer "+token)
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	f.a.Handler().ServeHTTP(w, r)
	return w
}
func portalUpload(t *testing.T, f privacyFixture, token, view, expected, set string, valid bool) *httptest.ResponseRecorder {
	t.Helper()
	var b bytes.Buffer
	writer := multipart.NewWriter(&b)
	writer.WriteField("expectedAssetId", expected)
	writer.WriteField("photoSetId", set)
	file, _ := writer.CreateFormFile("image", "fictional.png")
	if valid {
		png.Encode(file, image.NewRGBA(image.Rect(0, 0, 4, 4)))
	} else {
		file.Write([]byte("invalid fake image"))
	}
	writer.Close()
	r := httptest.NewRequest("POST", "/api/client-upload/photos/"+view, &b)
	r.Header.Set("Authorization", "Bearer "+token)
	r.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	f.a.Handler().ServeHTTP(w, r)
	return w
}
func createUploadTestLink(t *testing.T, f privacyFixture) (ClientUploadLink, string) {
	t.Helper()
	w := f.request(t, "POST", "/api/clients/"+f.client+"/upload-links", map[string]any{"title": "Fictional private self-upload", "hours": 24})
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	var result struct {
		Link ClientUploadLink
		Path string
	}
	json.Unmarshal(w.Body.Bytes(), &result)
	return result.Link, strings.Split(result.Path, "#")[1]
}
func TestClientUploadScopedWorkflow(t *testing.T) {
	f := newPrivacyFixture(t)
	if w := f.request(t, "POST", "/api/clients/"+f.client+"/upload-links", map[string]any{"title": "Denied"}); w.Code != 403 {
		t.Fatal(w.Code)
	}
	f.acknowledge(t)
	original, _ := f.asset(t, "")
	link, token := createUploadTestLink(t, f)
	digest := sha256.Sum256([]byte(token))
	var stored []byte
	f.a.DB.QueryRow("SELECT token_hash FROM client_upload_links WHERE id=$1", link.ID).Scan(&stored)
	if !bytes.Equal(stored, digest[:]) {
		t.Fatal("token is not hashed")
	}
	for _, bad := range []string{"", token + "invalid"} {
		if w := uploadPortalRequest(t, f, bad, "GET", "", nil); w.Code != 404 {
			t.Fatal("invalid token accepted")
		}
	}
	w := uploadPortalRequest(t, f, token, "GET", "", nil)
	if w.Code != 200 || w.Header().Get("Cache-Control") != "no-store" || strings.Contains(w.Body.String(), original) || strings.Contains(w.Body.String(), "Fictional Test Client") {
		t.Fatal("studio data leaked", w.Code, w.Body.String())
	}
	if w = portalUpload(t, f, token, "front", "", "", false); w.Code != 400 {
		t.Fatal("invalid image accepted")
	}
	if w = portalUpload(t, f, token, "invalid", "", "", true); w.Code != 400 {
		t.Fatal("invalid view accepted")
	}
	if w = portalUpload(t, f, token, "front", "", newID(), true); w.Code != 403 {
		t.Fatal("foreign set accepted")
	}
	w = portalUpload(t, f, token, "front", "", "", true)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	var asset Asset
	json.Unmarshal(w.Body.Bytes(), &asset)
	if w = portalUpload(t, f, token, "front", "", "", true); w.Code != 409 {
		t.Fatal("stale replacement accepted", w.Code, w.Body.String())
	}
	if w = uploadPortalRequest(t, f, token, "GET", "/photos/front", nil); w.Code != 200 || w.Header().Get("Cache-Control") != "private, no-store" {
		t.Fatal("photo not retrievable", w.Code)
	}
	for _, p := range []string{"/api/clients", "/api/clients/" + f.client, "/api/assets/" + asset.ID + "/content"} {
		r := httptest.NewRequest("GET", p, nil)
		r.Header.Set("Authorization", "Bearer "+token)
		out := httptest.NewRecorder()
		f.a.Handler().ServeHTTP(out, r)
		if out.Code != 401 {
			t.Fatal("bearer widened access", p, out.Code)
		}
	}
	input := map[string]any{"goal": "Practical fictional style", "maintenance": "low", "routine": "Five minutes", "likes": "Soft outline", "dislikes": "Heavy products"}
	if w = uploadPortalRequest(t, f, token, "POST", "/intake", map[string]any{"goal": "", "maintenance": "low"}); w.Code != 400 {
		t.Fatal("missing goal accepted")
	}
	if w = uploadPortalRequest(t, f, token, "POST", "/intake", input); w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = uploadPortalRequest(t, f, token, "POST", "/intake", input); w.Code != 409 {
		t.Fatal("submission overwritten")
	}
	var consultation string
	f.a.DB.QueryRow("SELECT consultation_id FROM client_upload_links WHERE id=$1", link.ID).Scan(&consultation)
	var photoConsult string
	f.a.DB.QueryRow("SELECT consultation_id FROM photo_sets WHERE id=$1", link.PhotoSetID).Scan(&photoConsult)
	if consultation == "" || consultation != photoConsult {
		t.Fatal("intake not integrated")
	}
	if w = f.request(t, "POST", "/api/clients/"+f.client+"/upload-links/"+link.ID+"/review", nil); w.Code != 200 {
		t.Fatal(w.Code)
	}
	// A studio assignment from another source is deliberately not disclosed by this link.
	f.a.DB.Exec("UPDATE photo_views SET asset_id=$1 WHERE set_id=$2 AND view='front'", original, link.PhotoSetID)
	if w = uploadPortalRequest(t, f, token, "GET", "/photos/front", nil); w.Code != 404 {
		t.Fatal("studio-assigned source leaked")
	}
	w = uploadPortalRequest(t, f, token, "GET", "", nil)
	if strings.Contains(w.Body.String(), original) {
		t.Fatal("source ID leaked")
	}
	f.a.DB.Exec("UPDATE photo_views SET asset_id=$1 WHERE set_id=$2 AND view='front'", asset.ID, link.PhotoSetID)
	if w = f.request(t, "DELETE", "/api/assets/"+asset.ID, map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code)
	}
	if w = uploadPortalRequest(t, f, token, "GET", "/photos/front", nil); w.Code != 404 {
		t.Fatal("deleted media restored")
	}
	f.a.Close()
	reopened, err := Open(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(reopened.Close)
	f.a = reopened
	if w = uploadPortalRequest(t, f, token, "GET", "", nil); w.Code != 200 || !strings.Contains(w.Body.String(), "Five minutes") {
		t.Fatal("restart lost intake")
	}
	if w = f.request(t, "POST", "/api/clients/"+f.client+"/upload-links/"+link.ID+"/revoke", nil); w.Code != 200 {
		t.Fatal(w.Code)
	}
	if w = uploadPortalRequest(t, f, token, "GET", "", nil); w.Code != 404 {
		t.Fatal("revoked link usable")
	}
	second, secondToken := createUploadTestLink(t, f)
	f.a.DB.Exec("UPDATE client_upload_links SET expires_at=$1 WHERE id=$2", now().Add(-time.Minute), second.ID)
	if w = uploadPortalRequest(t, f, secondToken, "GET", "", nil); w.Code != 404 {
		t.Fatal("expired link usable")
	}
	_, thirdToken := createUploadTestLink(t, f)
	if w = f.request(t, "POST", "/api/clients/"+f.client+"/withdraw", map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code)
	}
	if w = portalUpload(t, f, thirdToken, "front", "", "", true); w.Code != 404 {
		t.Fatal("withdrawn link recreated media")
	}
	f.acknowledge(t)
	if w = uploadPortalRequest(t, f, thirdToken, "GET", "", nil); w.Code != 404 {
		t.Fatal("fresh consent revived old link")
	}

	otherOrg, otherClient := newID(), newID()
	f.a.DB.Exec("INSERT INTO organizations(id,name) VALUES($1,'Other studio')", otherOrg)
	f.a.DB.Exec("INSERT INTO clients(id,organization_id,name) VALUES($1,$2,'Other client')", otherClient, otherOrg)
	if w = f.request(t, "GET", "/api/clients/"+otherClient+"/upload-links", nil); w.Code != 404 {
		t.Fatal("foreign studio disclosed links")
	}
}
func TestClientUploadTemplateAndReminderBoundaries(t *testing.T) {
	f := newPrivacyFixture(t)
	f.acknowledge(t)
	templateID := newID()
	snapshot := []IntakeQuestion{{ID: "care", Label: "Fictional care preference", Required: true}}
	f.a.DB.Exec("INSERT INTO intake_templates(id,organization_id,name,questions,version,updated_at) VALUES($1,$2,'Fictional intake',$3,1,$4)", templateID, f.org, string(rawJSON(snapshot)), now())
	base := "/api/clients/" + f.client
	w := f.request(t, "POST", base+"/upload-links", map[string]any{"title": "Template intake", "templateId": templateID, "templateVersion": 2})
	if w.Code != 409 {
		t.Fatal("stale template accepted", w.Code, w.Body.String())
	}
	w = f.request(t, "POST", base+"/upload-links", map[string]any{"title": "Template intake", "templateId": templateID, "templateVersion": 1})
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	var result struct {
		Link ClientUploadLink
		Path string
	}
	json.Unmarshal(w.Body.Bytes(), &result)
	token := strings.Split(result.Path, "#")[1]
	f.a.DB.Exec("UPDATE intake_templates SET version=2,questions='[]' WHERE id=$1", templateID)
	input := map[string]any{"goal": "Fictional easy style", "maintenance": "moderate"}
	if w = uploadPortalRequest(t, f, token, "POST", "/intake", input); w.Code != 400 {
		t.Fatal("snapshot required question bypassed")
	}
	input["answers"] = map[string]string{"care": "Light daily care"}
	if w = uploadPortalRequest(t, f, token, "POST", "/intake", input); w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	reminderInput := map[string]any{"title": "Fictional upload check-in", "message": "Review labeled views", "dueAt": now().Add(-time.Hour), "clientVisible": true}
	w = f.request(t, "POST", base+"/reminders", reminderInput)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	var due ClientReminder
	json.Unmarshal(w.Body.Bytes(), &due)
	if !due.Due || due.Version != 1 {
		t.Fatal("due state invalid")
	}
	reminderInput["title"] = "Internal private note"
	reminderInput["clientVisible"] = false
	w = f.request(t, "POST", base+"/reminders", reminderInput)
	if w.Code != 201 {
		t.Fatal(w.Code)
	}
	w = uploadPortalRequest(t, f, token, "GET", "", nil)
	if !strings.Contains(w.Body.String(), "Fictional upload check-in") || strings.Contains(w.Body.String(), "Internal private note") || strings.Contains(w.Body.String(), "Fictional Test Client") {
		t.Fatal("reminder privacy boundary", w.Body.String())
	}
	if w = f.request(t, "GET", "/api/reminders", nil); w.Code != 200 || !strings.Contains(w.Body.String(), "Internal private note") {
		t.Fatal("studio queue missing")
	}
	path := base + "/reminders/" + due.ID
	if w = f.request(t, "PATCH", path, map[string]any{"status": "completed", "version": 0}); w.Code != 409 {
		t.Fatal("stale reminder accepted")
	}
	if w = f.request(t, "PATCH", path, map[string]any{"status": "completed", "version": 1}); w.Code != 200 {
		t.Fatal(w.Code)
	}
	if w = f.request(t, "PATCH", path, map[string]any{"status": "dismissed", "version": 1}); w.Code != 409 {
		t.Fatal("completed reminder overwritten")
	}
	if w = f.request(t, "POST", base+"/withdraw", map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code)
	}
	var count int
	f.a.DB.QueryRow("SELECT count(*) FROM client_reminders WHERE client_id=$1 AND status='pending'", f.client).Scan(&count)
	if count != 0 {
		t.Fatal("withdrawal left pending reminders")
	}
	f.a.Close()
	reopened, err := Open(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(reopened.Close)
	f.a = reopened
	f.a.DB.QueryRow("SELECT count(*) FROM client_reminders WHERE client_id=$1 AND status='cancelled'", f.client).Scan(&count)
	if count != 1 {
		t.Fatal("restart lost cancellation")
	}
	if w = uploadPortalRequest(t, f, token, "GET", "", nil); w.Code != 404 {
		t.Fatal("restart revived revoked link")
	}
	if w = f.request(t, "DELETE", base, map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code)
	}
	for _, table := range []string{"client_upload_links", "client_upload_photos", "client_reminders"} {
		f.a.DB.QueryRow("SELECT count(*) FROM " + table).Scan(&count)
		if count != 0 {
			t.Fatal("client deletion retained dependent rows", table)
		}
	}
}
