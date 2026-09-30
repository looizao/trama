#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
runtime="$PWD/.scratch/private/runtime"
mkdir -p "$runtime/media"
if [[ ! -f "$runtime/local.env" ]]; then
  printf 'ADMIN_EMAIL=demo@trama.local\nADMIN_PASSWORD=%s\n' "$(openssl rand -hex 24)" > "$runtime/local.env"
fi
set -a
source "$runtime/local.env"
set +a
export DATABASE_PATH="$runtime/trama.db" STORAGE_MODE=local STORAGE_DIR="$runtime/media"
export HOST=127.0.0.1 PORT=8080 PUBLIC_BASE_URL=http://127.0.0.1:8080
export TEMPORAL_ADDRESS= RUN_WORKER_IN_API=false MIGRATION_REDIRECT_URL=
export IMAGE_API_BASE_URL= IMAGE_API_KEY= IMAGE_MODEL=
printf 'Local app: %s\nLocal credentials: %s/local.env\n' "$PUBLIC_BASE_URL" "$runtime"
exec mise exec go@1.26.0 -- go run ./cmd/api
