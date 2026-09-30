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
	mux.HandleFunc("GET /api/permission/{token}", a.permissionNotice)
	mux.HandleFunc("POST /api/permission/{token}", a.acknowledgePermission)
	mux.HandleFunc("GET /api/client-upload", a.clientUploadPortal)
	mux.HandleFunc("POST /api/client-upload/intake", a.clientUploadIntake)
	mux.HandleFunc("POST /api/client-upload/photos/{view}", a.clientUploadPhoto)
	mux.HandleFunc("GET /api/client-upload/photos/{view}", a.clientUploadContent)
	mux.HandleFunc("GET /api/clients/{clientID}/upload-links", a.authenticated(a.listClientUploadLinks))
	mux.HandleFunc("POST /api/clients/{clientID}/upload-links", a.authenticated(a.createClientUploadLink))
	mux.HandleFunc("POST /api/clients/{clientID}/upload-links/{linkID}/revoke", a.authenticated(a.revokeClientUploadLink))
	mux.HandleFunc("POST /api/clients/{clientID}/upload-links/{linkID}/review", a.authenticated(a.reviewClientUploadIntake))
	mux.HandleFunc("GET /api/reminders", a.authenticated(a.listClientReminders))
	mux.HandleFunc("GET /api/clients/{clientID}/reminders", a.authenticated(a.listClientReminders))
	mux.HandleFunc("POST /api/clients/{clientID}/reminders", a.authenticated(a.createClientReminder))
	mux.HandleFunc("PATCH /api/clients/{clientID}/reminders/{reminderID}", a.authenticated(a.updateClientReminder))
	mux.HandleFunc("GET /api/me", a.authenticated(func(w http.ResponseWriter, r *http.Request) { respond(w, 200, userFrom(r)) }))
	mux.HandleFunc("GET /api/privacy-requests", a.authenticated(a.listPrivacyRequests))
	mux.HandleFunc("POST /api/password", a.authenticated(a.changePassword))
	mux.HandleFunc("GET /api/models", a.authenticated(a.models))
	mux.HandleFunc("GET /api/demo-library", a.authenticated(a.listDemoLibrary))
	mux.HandleFunc("GET /api/demo-library/{kind}/{styleID}/{format}", a.authenticated(a.demoLibraryContent))
	mux.HandleFunc("GET /api/clients/{clientID}/style-references", a.authenticated(a.listStyleReferences))
	mux.HandleFunc("POST /api/clients/{clientID}/style-references", a.authenticated(a.createStyleReference))
	mux.HandleFunc("DELETE /api/style-references/{referenceID}", a.authenticated(a.removeStyleReference))
	mux.HandleFunc("GET /api/clients/{clientID}/demo-workspace", a.authenticated(a.getDemoWorkspace))
	mux.HandleFunc("PUT /api/clients/{clientID}/demo-workspace", a.authenticated(a.saveDemoWorkspace))
	mux.HandleFunc("GET /api/clients/{clientID}/demo-options", a.authenticated(a.listDemoOptions))
	mux.HandleFunc("POST /api/clients/{clientID}/demo-options", a.authenticated(a.saveDemoOption))
	mux.HandleFunc("GET /api/clients/{clientID}/demo-options/{optionID}/preview", a.authenticated(a.optionPreview))
	mux.HandleFunc("PUT /api/clients/{clientID}/demo-options/{optionID}/preview", a.authenticated(a.retainOptionPreview))
	mux.HandleFunc("GET /api/clients/{clientID}/expected-results", a.authenticated(a.listExpectedResults))
	mux.HandleFunc("POST /api/clients/{clientID}/expected-results", a.authenticated(a.selectExpectedResult))
	mux.HandleFunc("GET /api/clients/{clientID}/outcome-visits", a.authenticated(a.listOutcomeVisits))
	mux.HandleFunc("POST /api/clients/{clientID}/outcome-visits", a.authenticated(a.createOutcomeVisit))
	mux.HandleFunc("POST /api/clients/{clientID}/demo-refinements", a.authenticated(a.refineDemoProposal))
	mux.HandleFunc("GET /api/clients/{clientID}/demo-jobs", a.authenticated(a.listDemoJobs))
	mux.HandleFunc("POST /api/clients/{clientID}/demo-jobs", a.authenticated(a.createDemoJob))
	mux.HandleFunc("GET /api/clients/{clientID}/demo-jobs/{runID}/artifacts/{kind}/{artifactID}", a.authenticated(a.nativeDemoArtifact))
	mux.HandleFunc("POST /api/clients/{clientID}/demo-jobs/{runID}/cancel", a.authenticated(a.cancelDemoJob))
	mux.HandleFunc("GET /api/intake-templates", a.authenticated(a.listTemplates))
	mux.HandleFunc("POST /api/intake-templates", a.authenticated(a.saveTemplate))
	mux.HandleFunc("PATCH /api/intake-templates/{templateID}", a.authenticated(a.saveTemplate))
	mux.HandleFunc("GET /api/clients/{clientID}/consultations", a.authenticated(a.listConsultations))
	mux.HandleFunc("POST /api/clients/{clientID}/consultations", a.authenticated(a.createConsultation))
	mux.HandleFunc("GET /api/clients", a.authenticated(a.listClients))
	mux.HandleFunc("POST /api/clients", a.authenticated(a.createClient))
	mux.HandleFunc("GET /api/clients/{clientID}", a.authenticated(a.getClient))
	mux.HandleFunc("PATCH /api/clients/{clientID}", a.authenticated(a.updateClient))
	mux.HandleFunc("GET /api/clients/{clientID}/permission", a.authenticated(a.getPermission))
	mux.HandleFunc("POST /api/clients/{clientID}/permission-link", a.authenticated(a.createPermissionLink))
	mux.HandleFunc("POST /api/clients/{clientID}/withdraw", a.authenticated(a.withdrawPermission))
	mux.HandleFunc("DELETE /api/clients/{clientID}", a.authenticated(a.deleteClient))
	mux.HandleFunc("GET /api/clients/{clientID}/deletion-impact", a.authenticated(a.clientDeletionImpact))
	mux.HandleFunc("GET /api/assets/{assetID}/deletion-impact", a.authenticated(a.assetDeletionImpact))
	mux.HandleFunc("DELETE /api/assets/{assetID}", a.authenticated(a.deleteAsset))
	mux.HandleFunc("GET /api/clients/{clientID}/milestones", a.authenticated(a.listMilestones))
	mux.HandleFunc("POST /api/clients/{clientID}/milestones", a.authenticated(a.createMilestone))
	mux.HandleFunc("GET /api/clients/{clientID}/photo-sets", a.authenticated(a.listPhotoSets))
	mux.HandleFunc("POST /api/clients/{clientID}/photo-sets", a.authenticated(a.createPhotoSet))
	mux.HandleFunc("PATCH /api/photo-sets/{setID}/views/{view}", a.authenticated(a.assignPhotoView))
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
		if a.privacyFault.Load() && r.URL.Path != "/health" {
			problem(w, 503, "privacy recovery is required before serving data")
			return
		}
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
