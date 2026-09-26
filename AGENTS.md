# Trama

Trama is a prototype workspace for visagism professionals. A studio manages clients, gives each client one or more cases, and organizes portrait images into ordered milestones that show changes in hair and appearance. Demo clients and portraits are fictional.

## Architecture

- `web/`: React 19, TypeScript, Vite, TanStack Router, and TanStack Query.
- `cmd/api/` and `internal/app/`: Go 1.26 HTTP API, session-based email/password login, admin functions, and SQLite access through `database/sql`. The API serves the built frontend.
- SQLite stores clients, cases, milestones, sessions, and image metadata. Google Cloud Storage stores portrait images in production. Database, local, S3, and GCS storage modes are supported.
- `cmd/worker/`: Temporal worker for image generation. The API can run that worker in the same process with `RUN_WORKER_IN_API=true`. Generation needs Temporal plus an OpenAI-compatible image edit proxy configured with `IMAGE_API_BASE_URL`, `IMAGE_API_KEY`, and `IMAGE_MODEL`. It is currently disabled on the free prototype.

Run `go test ./...` and `npm --prefix web run build` for code checks. `Dockerfile` builds the frontend and Go API for deployment.

## Google Cloud

After completing an app code or UI change, run relevant checks, commit and push it to the repository, deploy that commit to Google Cloud, and verify the live app. Keep changes local only when the user explicitly asks.

The production project is `trama-509722`. The `trama-prototype` Compute Engine VM is in `us-east1-b`, and the app is available at https://trama.34-24-249-190.sslip.io. Caddy terminates HTTPS and proxies to the `trama.service` systemd unit on `127.0.0.1:8080`. Use `gcloud --project=trama-509722 compute ssh trama-prototype --zone=us-east1-b` for service status and logs.

The SQLite database is on the persistent `trama-data` disk at `/mnt/disks/trama-data/trama.db`. Portraits and encrypted database backups are in `gs://trama-509722-assets`. The `trama-backup.timer` systemd timer creates a daily snapshot, encrypts it, uploads it, downloads it, decrypts it, and runs SQLite integrity verification. Never replace the production database without a recent verified backup. Keep credentials and backup passphrases out of Git.
