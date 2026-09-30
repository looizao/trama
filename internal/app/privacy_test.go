package app

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

type privacyFixture struct {
	a                        *App
	cookie                   *http.Cookie
	org, user, client, token string
}

func newPrivacyFixture(t *testing.T) privacyFixture {
	t.Helper()
	dir := t.TempDir()
	t.Setenv("DATABASE_PATH", filepath.Join(dir, "test.db"))
	t.Setenv("PRIVACY_LEDGER_PATH", filepath.Join(dir, "privacy.jsonl"))
	t.Setenv("STORAGE_MODE", "local")
	t.Setenv("STORAGE_DIR", filepath.Join(dir, "media"))
	t.Setenv("ADMIN_EMAIL", "demo@example.test")
	t.Setenv("ADMIN_PASSWORD", "local disposable test password")
	t.Setenv("PUBLIC_BASE_URL", "http://localhost")
	t.Setenv("IMAGE_API_BASE_URL", "")
	t.Setenv("IMAGE_API_KEY", "")
	t.Setenv("IMAGE_MODEL", "")
	a, err := Open(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(a.Close)
	f := privacyFixture{a: a, client: newID()}
	if err = a.DB.QueryRow("SELECT id,organization_id FROM users LIMIT 1").Scan(&f.user, &f.org); err != nil {
		t.Fatal(err)
	}
	if _, err = a.DB.Exec("INSERT INTO clients(id,organization_id,name) VALUES($1,$2,'Fictional Test Client')", f.client, f.org); err != nil {
		t.Fatal(err)
	}
	token, digest, err := newSessionToken()
	if err != nil {
		t.Fatal(err)
	}
	if _, err = a.DB.Exec("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)", digest, f.user, now().Add(time.Hour)); err != nil {
		t.Fatal(err)
	}
	f.cookie = &http.Cookie{Name: sessionCookie, Value: token}
	return f
}

func (f privacyFixture) request(t *testing.T, method, path string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var data []byte
	if body != nil {
		var err error
		data, err = json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
	}
	r := httptest.NewRequest(method, path, bytes.NewReader(data))
	r.Header.Set("Content-Type", "application/json")
	if f.cookie != nil {
		r.AddCookie(f.cookie)
	}
	w := httptest.NewRecorder()
	f.a.Handler().ServeHTTP(w, r)
	return w
}

func (f privacyFixture) acknowledge(t *testing.T) {
	t.Helper()
	w := f.request(t, "POST", "/api/clients/"+f.client+"/permission-link", nil)
	if w.Code != 201 {
		t.Fatal(w.Code, w.Body.String())
	}
	var link struct{ Path string }
	if err := json.Unmarshal(w.Body.Bytes(), &link); err != nil {
		t.Fatal(err)
	}
	w = f.request(t, "POST", "/api"+link.Path, map[string]any{"name": "Fictional Test Client", "acknowledged": true, "noticeVersion": permissionVersion})
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "GET", "/api"+link.Path, nil); w.Code != 404 {
		t.Fatal("one-time link remains usable")
	}
}

func (f privacyFixture) asset(t *testing.T, parent string) (string, string) {
	t.Helper()
	id := newID()
	key := f.org + "/" + f.client + "/" + id + ".png"
	if err := f.a.Storage.Put(context.Background(), key, "image/png", bytes.NewReader([]byte("private fixture bytes"))); err != nil {
		t.Fatal(err)
	}
	var source any
	if parent != "" {
		source = parent
	}
	_, err := f.a.DB.Exec("INSERT INTO assets(id,organization_id,client_id,storage_key,content_type,kind,source_asset_id) VALUES($1,$2,$3,$4,'image/png','source',$5)", id, f.org, f.client, key, source)
	if err != nil {
		t.Fatal(err)
	}
	return id, key
}

func TestPermissionAcknowledgementAndStudioBoundaries(t *testing.T) {
	f := newPrivacyFixture(t)
	w := f.request(t, "POST", "/api/clients/"+f.client+"/assets", nil)
	if w.Code != 403 {
		t.Fatal("media accepted without permission", w.Code)
	}
	w = f.request(t, "POST", "/api/clients/"+f.client+"/permission-link", nil)
	var link struct{ Path string }
	_ = json.Unmarshal(w.Body.Bytes(), &link)
	for _, body := range []map[string]any{{"name": "Fictional Test Client", "acknowledged": false, "noticeVersion": permissionVersion}, {"name": "Another person", "acknowledged": true, "noticeVersion": permissionVersion}, {"name": "Fictional Test Client", "acknowledged": true, "noticeVersion": "old notice"}} {
		if w = f.request(t, "POST", "/api"+link.Path, body); w.Code != 400 {
			t.Fatal("invalid acknowledgement accepted")
		}
	}
	f.acknowledge(t)
	if !f.a.hasPermission(context.Background(), f.client) {
		t.Fatal("valid permission rejected")
	}
	id, _ := f.asset(t, "")
	other := newID()
	user := newID()
	_, err := f.a.DB.Exec("INSERT INTO organizations(id,name) VALUES($1,'Other studio')", other)
	if err != nil {
		t.Fatal(err)
	}
	_, err = f.a.DB.Exec("INSERT INTO users(id,organization_id,email,name,password_hash,role) VALUES($1,$2,'other@example.test','Other','unused','professional')", user, other)
	if err != nil {
		t.Fatal(err)
	}
	token, digest, _ := newSessionToken()
	_, err = f.a.DB.Exec("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)", digest, user, now().Add(time.Hour))
	if err != nil {
		t.Fatal(err)
	}
	foreign := f
	foreign.cookie = &http.Cookie{Name: sessionCookie, Value: token}
	for _, path := range []string{"/api/clients/" + f.client, "/api/clients/" + f.client + "/permission", "/api/assets/" + id + "/content", "/api/assets/" + id + "/deletion-impact"} {
		if w = foreign.request(t, "GET", path, nil); w.Code != 404 {
			t.Fatalf("studio boundary leaked %s: %d", path, w.Code)
		}
	}
	if w = foreign.request(t, "DELETE", "/api/assets/"+id, map[string]bool{"confirmed": true}); w.Code != 404 {
		t.Fatal("another studio deleted media")
	}
	_, err = f.a.DB.Exec("UPDATE permission_links SET expires_at=$1", now().Add(-time.Hour))
	if err != nil {
		t.Fatal(err)
	}
	if w = f.request(t, "GET", "/api"+link.Path, nil); w.Code != 404 {
		t.Fatal("expired link accepted")
	}
}

func TestTransitiveErasureWithdrawalAndRestart(t *testing.T) {
	f := newPrivacyFixture(t)
	f.acknowledge(t)
	source, key := f.asset(t, "")
	child, childKey := f.asset(t, source)
	_, grandKey := f.asset(t, child)
	unrelated, unrelatedKey := f.asset(t, "")
	if w := f.request(t, "DELETE", "/api/assets/"+source, map[string]bool{"confirmed": false}); w.Code != 400 {
		t.Fatal("unconfirmed deletion accepted")
	}
	w := f.request(t, "GET", "/api/assets/"+source+"/deletion-impact", nil)
	if !strings.Contains(w.Body.String(), `"mediaCount":3`) {
		t.Fatal(w.Body.String())
	}
	w = f.request(t, "DELETE", "/api/assets/"+source, map[string]bool{"confirmed": true})
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	for _, k := range []string{key, childKey, grandKey} {
		if body, err := f.a.Storage.Get(context.Background(), k); err == nil {
			body.Close()
			t.Fatal("dependent file retained")
		}
	}
	if body, err := f.a.Storage.Get(context.Background(), unrelatedKey); err != nil {
		t.Fatal("unrelated media removed")
	} else {
		body.Close()
	}
	if w = f.request(t, "POST", "/api/clients/"+f.client+"/withdraw", map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if f.a.hasPermission(context.Background(), f.client) {
		t.Fatal("withdrawal did not revoke permission")
	}
	if w = f.request(t, "GET", "/api/assets/"+unrelated+"/content", nil); w.Code != 404 {
		t.Fatal("withdrawn media accessible")
	}
	f.acknowledge(t)
	if !f.a.hasPermission(context.Background(), f.client) {
		t.Fatal("fresh affirmative permission rejected")
	}
	// A new process and freshly acknowledged media must survive old ledger entries.
	newID, newKey := f.asset(t, "")
	second, err := Open(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer second.Close()
	if !second.hasPermission(context.Background(), f.client) {
		t.Fatal("old withdrawal overwrote fresh acknowledgement on restart")
	}
	if body, err := second.Storage.Get(context.Background(), newKey); err != nil {
		t.Fatal(err)
	} else {
		body.Close()
	}
	if w = f.request(t, "DELETE", "/api/clients/"+f.client, map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if w = f.request(t, "GET", "/api/clients/"+f.client, nil); w.Code != 404 {
		t.Fatal("deleted client accessible")
	}
	var n int
	if err = f.a.DB.QueryRow("SELECT count(*) FROM assets WHERE id=$1", newID).Scan(&n); err != nil || n != 0 {
		t.Fatal("personal media metadata retained")
	}
	ledger, err := os.ReadFile(f.a.PrivacyLedgerPath)
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Contains(ledger, []byte("private fixture bytes")) || bytes.Contains(ledger, []byte("Fictional Test Client")) {
		t.Fatal("sensitive content in deletion ledger")
	}
}

func TestLateWorkerCannotRecreateDeletedSource(t *testing.T) {
	f := newPrivacyFixture(t)
	f.acknowledge(t)
	source, _ := f.asset(t, "")
	run := newID()
	_, err := f.a.DB.Exec("INSERT INTO generation_runs(id,organization_id,client_id,source_asset_id,prompt,model_id,quantity,status,created_by) VALUES($1,$2,$3,$4,'Test proposal','test-model',1,'queued',$5)", run, f.org, f.client, source, f.user)
	if err != nil {
		t.Fatal(err)
	}
	started := make(chan struct{})
	release := make(chan struct{})
	portrait, _ := base64.StdEncoding.DecodeString("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/iXcAAAAASUVORK5CYII=")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		close(started)
		<-release
		_ = json.NewEncoder(w).Encode(map[string]any{"data": []map[string]string{{"b64_json": base64.StdEncoding.EncodeToString(portrait)}}})
	}))
	defer server.Close()
	worker, err := Open(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer worker.Close()
	worker.ImageAPIBaseURL = server.URL
	worker.ImageAPIKey = "local-test"
	worker.ImageModel = "test-model"
	done := make(chan error, 1)
	go func() { done <- worker.GenerateImages(context.Background(), run) }()
	select {
	case <-started:
	case <-time.After(5 * time.Second):
		t.Fatal("worker did not start")
	}
	w := f.request(t, "DELETE", "/api/assets/"+source, map[string]bool{"confirmed": true})
	close(release)
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body.String())
	}
	if err = <-done; err == nil {
		t.Fatal("late generation reported success")
	}
	if err = worker.FailRun(context.Background(), run, "late error"); err != nil {
		t.Fatal(err)
	}
	var status string
	_ = f.a.DB.QueryRow("SELECT status FROM generation_runs WHERE id=$1", run).Scan(&status)
	if status != "cancelled" {
		t.Fatal("late worker overwrote cancellation", status)
	}
	var n int
	_ = f.a.DB.QueryRow("SELECT count(*) FROM assets WHERE client_id=$1", f.client).Scan(&n)
	if n != 0 {
		t.Fatal("late worker recreated deleted media")
	}
	err = filepath.Walk(os.Getenv("STORAGE_DIR"), func(_ string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			t.Error("orphan media remains")
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestMissingOrCorruptPrivacyLedgerFailsClosed(t *testing.T) {
	f := newPrivacyFixture(t)
	f.acknowledge(t)
	id, _ := f.asset(t, "")
	if w := f.request(t, "DELETE", "/api/assets/"+id, map[string]bool{"confirmed": true}); w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	if err := os.Remove(f.a.PrivacyLedgerPath); err != nil {
		t.Fatal(err)
	}
	if other, err := Open(context.Background()); err == nil {
		other.Close()
		t.Fatal("missing deletion safeguard accepted")
	}
	if err := os.WriteFile(f.a.PrivacyLedgerPath, []byte("broken ledger\n"), 0600); err != nil {
		t.Fatal(err)
	}
	if other, err := Open(context.Background()); err == nil {
		other.Close()
		t.Fatal("corrupt deletion safeguard accepted")
	}
	if w := f.request(t, "POST", "/api/clients/"+f.client+"/permission-link", nil); w.Code != 503 {
		t.Fatal("mutation ignored broken ledger")
	}
	if w := f.request(t, "GET", "/api/clients/"+f.client, nil); w.Code != 503 {
		t.Fatal("data served after privacy recovery failure")
	}
}

func TestPendingStorageErasureIsRetriedOnRestart(t *testing.T) {
	f := newPrivacyFixture(t)
	f.acknowledge(t)
	id, key := f.asset(t, "")
	path, _ := f.a.Storage.safePath(key)
	if err := os.Remove(path); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(path, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(path, "block-removal"), []byte("fixture"), 0600); err != nil {
		t.Fatal(err)
	}
	w := f.request(t, "DELETE", "/api/assets/"+id, map[string]bool{"confirmed": true})
	if w.Code != 202 {
		t.Fatal("cleanup failure not visible", w.Code, w.Body.String())
	}
	if w = f.request(t, "GET", "/api/assets/"+id+"/content", nil); w.Code != 404 {
		t.Fatal("pending cleanup remains accessible")
	}
	if err := os.RemoveAll(path); err != nil {
		t.Fatal(err)
	}
	second, err := Open(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer second.Close()
	var n int
	_ = second.DB.QueryRow("SELECT count(*) FROM privacy_requests WHERE status!='completed'").Scan(&n)
	if n != 0 {
		t.Fatal("pending cleanup was not completed")
	}
	var b bytes.Buffer
	rows, err := second.DB.Query("SELECT action FROM privacy_requests")
	if err != nil {
		t.Fatal(err)
	}
	for rows.Next() {
		var action string
		_ = rows.Scan(&action)
		_, _ = io.WriteString(&b, action)
	}
	rows.Close()
	if b.Len() == 0 {
		t.Fatal("request history lost")
	}
}
