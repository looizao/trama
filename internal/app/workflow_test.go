package app

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestImageProxyContract(t *testing.T) {
	portrait, err := base64.StdEncoding.DecodeString("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/iXcAAAAASUVORK5CYII=")
	if err != nil {
		t.Fatal(err)
	}
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "source.png"), portrait, 0600); err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/images/edits" || r.Method != http.MethodPost {
			t.Errorf("unexpected route: %s %s", r.Method, r.URL.Path)
		}
		if r.Header.Get("Authorization") != "Bearer test-key" || r.Header.Get("Idempotency-Key") != "test-run" {
			t.Error("missing proxy authorization or idempotency key")
		}
		if err := r.ParseMultipartForm(12 << 20); err != nil {
			t.Error(err)
		}
		if r.FormValue("model") != "test-image-model" || r.FormValue("n") != "2" || r.FormValue("prompt") != "Try a short bob" {
			t.Error("wrong proxy parameters")
		}
		file, _, err := r.FormFile("image")
		if err != nil {
			t.Error(err)
		} else {
			defer file.Close()
			data := make([]byte, len(portrait))
			_, _ = file.Read(data)
			if !bytes.Equal(data, portrait) {
				t.Error("source image was changed")
			}
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"data": []map[string]string{{"b64_json": base64.StdEncoding.EncodeToString(portrait)}, {"b64_json": base64.StdEncoding.EncodeToString(portrait)}}})
	}))
	defer server.Close()
	a := &App{Storage: &Storage{mode: "local", dir: dir}, ImageAPIBaseURL: server.URL + "/v1", ImageAPIKey: "test-key", ImageModel: "test-image-model"}
	images, err := a.editImages(context.Background(), "test-run", "source.png", "image/png", "Try a short bob", 2)
	if err != nil {
		t.Fatal(err)
	}
	if len(images) != 2 || !bytes.Equal(images[0], portrait) || !bytes.Equal(images[1], portrait) {
		t.Fatal("wrong proxy images")
	}
}
