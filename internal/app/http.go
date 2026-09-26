package app

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func (a *App) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) { respond(w, 200, map[string]string{"status": "ok"}) })
	mux.HandleFunc("GET /api/model-assets/{token}", a.modelAssetContent)
	mux.HandleFunc("POST /api/login", a.login)
	mux.HandleFunc("POST /api/logout", a.logout)
	mux.HandleFunc("GET /api/me", a.authenticated(func(w http.ResponseWriter, r *http.Request) { respond(w, 200, userFrom(r)) }))
	mux.HandleFunc("POST /api/password", a.authenticated(a.changePassword))
	mux.HandleFunc("GET /api/models", a.authenticated(a.models))
	mux.HandleFunc("GET /api/clients", a.authenticated(a.listClients))
	mux.HandleFunc("POST /api/clients", a.authenticated(a.createClient))
	mux.HandleFunc("GET /api/clients/{clientID}", a.authenticated(a.getClient))
	mux.HandleFunc("PATCH /api/clients/{clientID}", a.authenticated(a.updateClient))
	mux.HandleFunc("GET /api/clients/{clientID}/milestones", a.authenticated(a.listMilestones))
	mux.HandleFunc("POST /api/clients/{clientID}/milestones", a.authenticated(a.createMilestone))
	mux.HandleFunc("GET /api/clients/{clientID}/assets", a.authenticated(a.listAssets))
	mux.HandleFunc("POST /api/clients/{clientID}/assets", a.authenticated(a.uploadAsset))
	mux.HandleFunc("GET /api/assets/{assetID}/content", a.authenticated(a.assetContent))
	mux.HandleFunc("POST /api/assets/{assetID}/place", a.authenticated(a.placeAsset))
	mux.HandleFunc("GET /api/clients/{clientID}/runs", a.authenticated(a.listRuns))
	mux.HandleFunc("POST /api/clients/{clientID}/runs", a.authenticated(a.createRun))
	mux.HandleFunc("GET /api/runs/{runID}", a.authenticated(a.getRun))
	mux.HandleFunc("GET /api/admin/users", a.authenticated(requireAdmin(a.listUsers)))
	mux.HandleFunc("POST /api/admin/users", a.authenticated(requireAdmin(a.createUser)))
	mux.HandleFunc("PATCH /api/admin/users/{userID}", a.authenticated(requireAdmin(a.updateUser)))
	mux.HandleFunc("GET /api/admin/audit", a.authenticated(requireAdmin(a.listAudit)))
	mux.HandleFunc("/", a.serveWeb)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead && r.Method != http.MethodOptions {
			origin := r.Header.Get("Origin")
			if origin != "" {
				base := os.Getenv("PUBLIC_BASE_URL")
				if base == "" {
					base = "http://" + r.Host
					if r.TLS != nil {
						base = "https://" + r.Host
					}
				}
				if origin != strings.TrimSuffix(base, "/") {
					problem(w, 403, "invalid request origin")
					return
				}
			}
		}
		defer func() {
			if recovered := recover(); recovered != nil {
				log.Printf("panic: %v", recovered)
				problem(w, 500, "internal error")
			}
		}()
		mux.ServeHTTP(w, r)
	})
}

func (a *App) serveWeb(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" && r.Method != "HEAD" {
		problem(w, 404, "not found")
		return
	}
	if strings.HasPrefix(r.URL.Path, "/api/") {
		problem(w, 404, "not found")
		return
	}
	clean := filepath.Clean(strings.TrimPrefix(r.URL.Path, "/"))
	if clean == ".." || strings.HasPrefix(clean, "../") {
		problem(w, 404, "not found")
		return
	}
	path := filepath.Join("web/dist", clean)
	if info, err := os.Stat(path); err == nil && !info.IsDir() {
		if strings.HasPrefix(r.URL.Path, "/assets/") {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		}
		http.ServeFile(w, r, path)
		return
	}
	http.ServeFile(w, r, "web/dist/index.html")
}

func (a *App) audit(r *http.Request, action, kind, id string) {
	u := userFrom(r)
	_, err := a.DB.ExecContext(r.Context(), "INSERT INTO audit_events(id,organization_id,actor_id,action,subject_type,subject_id) VALUES($1,$2,$3,$4,$5,$6)", newID(), u.OrganizationID, u.ID, action, kind, id)
	if err != nil {
		log.Printf("audit failed: %v", err)
	}
}

func (a *App) models(w http.ResponseWriter, r *http.Request) {
	models := []map[string]string{}
	if a.ImageModel != "" {
		models = append(models, map[string]string{"id": a.ImageModel, "name": a.ImageModel, "capability": "Reference image editing"})
	}
	respond(w, 200, map[string]any{"enabled": a.modelReady(), "models": models})
}

func (a *App) modelReady() bool {
	if a.ImageAPIBaseURL == "" || a.ImageAPIKey == "" || a.ImageModel == "" || a.Temporal == nil {
		return false
	}
	return true
}

func parseTime(t time.Time) string { return t.UTC().Format(time.RFC3339) }

func rawJSON(v any) json.RawMessage { b, _ := json.Marshal(v); return b }
