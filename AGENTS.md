# Trama

Trama is a prototype workspace for visagism professionals. A studio manages clients, gives each client one or more cases, and organizes portrait images into ordered milestones that show changes in hair and appearance. Demo clients and portraits are fictional.

## Architecture

- `web/`: React 19, TypeScript, Vite, TanStack Router, and TanStack Query.
- `cmd/api/` and `internal/app/`: Go 1.26 HTTP API, session-based email/password login, admin functions, and PostgreSQL access through pgx. The API serves the built frontend.
- PostgreSQL stores clients, cases, milestones, sessions, image metadata, and prototype image bytes (`STORAGE_MODE=db`). S3 storage is also supported.
- `cmd/worker/`: Temporal worker for image generation. The API can run that worker in the same process with `RUN_WORKER_IN_API=true`. Generation needs Temporal plus an OpenAI-compatible image edit proxy configured with `IMAGE_API_BASE_URL`, `IMAGE_API_KEY`, and `IMAGE_MODEL`. It is currently disabled on the free prototype.

Run `go test ./...` and `npm --prefix web run build` for code checks. `Dockerfile` builds the frontend and Go API for deployment.

## Render

After completing an app code or UI change, run relevant checks, commit and push it to the repository, deploy that commit to Render, and verify the live app. Keep changes local only when the user explicitly asks.

The free web service is `trama-prototype` (`srv-daqohcpsrm7s73drhdp0`) at https://trama-prototype.onrender.com. Use the Render CLI: `render login` if needed, `render services --output json` to inspect resources, `render logs --resources srv-daqohcpsrm7s73drhdp0 --tail` for logs, and `render deploys list srv-daqohcpsrm7s73drhdp0` for deploy status. Deploy with `render deploys create srv-daqohcpsrm7s73drhdp0` when appropriate.

The current free PostgreSQL ID is in `.secrets/current-db-id`; inspect its status and `expiresAt` with `render postgres get "$(cat .secrets/current-db-id)" --output json`. It expires after about 30 days. `scripts/backup-db.sh` creates and verifies an encrypted archive in `backups/` and restores the database IP allow list. `scripts/recycle-db.sh` is for use only after expiry with a verified recent backup. Never delete the database to force a recycle or select a paid plan. Keep `.secrets/`, `backups/`, and credentials out of Git.
