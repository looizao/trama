package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMigrationRedirectHandler(t *testing.T) {
	handler, err := migrationRedirectHandler("https://trama.example/base/")
	if err != nil {
		t.Fatal(err)
	}

	health := httptest.NewRecorder()
	handler.ServeHTTP(health, httptest.NewRequest(http.MethodGet, "/health", nil))
	if health.Code != http.StatusOK || health.Body.String() != `{"status":"redirecting"}` {
		t.Fatalf("unexpected health response: %d %q", health.Code, health.Body.String())
	}

	redirect := httptest.NewRecorder()
	handler.ServeHTTP(redirect, httptest.NewRequest(http.MethodGet, "/clients/123?view=timeline", nil))
	if redirect.Code != http.StatusTemporaryRedirect {
		t.Fatalf("unexpected redirect status: %d", redirect.Code)
	}
	if got := redirect.Header().Get("Location"); got != "https://trama.example/base/clients/123?view=timeline" {
		t.Fatalf("unexpected redirect location: %q", got)
	}
}

func TestMigrationRedirectHandlerRejectsUnsafeTarget(t *testing.T) {
	if _, err := migrationRedirectHandler("http://trama.example"); err == nil {
		t.Fatal("expected HTTP target to be rejected")
	}
}
