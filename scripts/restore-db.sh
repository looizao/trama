#!/usr/bin/env bash
set -euo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/db-common.sh"

if [[ $# -ne 2 ]]; then
  printf 'Usage: %s ENCRYPTED_ARCHIVE NEW_RENDER_DB_ID\n' "$0" >&2
  exit 2
fi
archive=$1
db_id=$2
[[ -f "$archive" && -s "$TRAMA_KEY_FILE" ]] || { printf 'Backup or decryption key is missing.\n' >&2; exit 1; }
command -v render >/dev/null
command -v pg_restore >/dev/null
command -v psql >/dev/null
command -v gpg >/dev/null
umask 077
trap 'trama_close_access' EXIT
trama_open_access "$db_id"
db_url=$(trama_connection_url "$db_id" external)
existing=$(PGSSLMODE=require PGCONNECT_TIMEOUT=15 psql "$db_url" -Atqc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")
if [[ "$existing" != 0 ]]; then
  printf 'Refusing to restore into a nonempty database (%s tables).\n' "$existing" >&2
  exit 1
fi
gpg --batch --quiet --pinentry-mode loopback --passphrase-file "$TRAMA_KEY_FILE" --decrypt "$archive" |
  PGSSLMODE=require PGCONNECT_TIMEOUT=15 pg_restore --dbname="$db_url" --no-owner --no-privileges --exit-on-error --single-transaction
counts=$(PGSSLMODE=require PGCONNECT_TIMEOUT=15 psql "$db_url" -Atqc 'SELECT (SELECT count(*) FROM users), (SELECT count(*) FROM clients), (SELECT count(*) FROM assets)')
trama_close_access
printf 'Restored users|clients|assets: %s\n' "$counts"

internal_url=$(trama_connection_url "$db_id" internal)
if [[ -n "${RENDER_API_KEY:-}" ]]; then
  payload=$(mktemp)
  trap 'rm -f "$payload"' EXIT
  jq -n --arg value "$internal_url" '{value:$value}' > "$payload"
  curl -fsS -X PUT "https://api.render.com/v1/services/srv-daqohcpsrm7s73drhdp0/env-vars/DATABASE_URL" \
    -H "Authorization: Bearer $RENDER_API_KEY" -H 'Content-Type: application/json' --data-binary "@$payload" >/dev/null
  render deploys create srv-daqohcpsrm7s73drhdp0 --confirm --output json >/dev/null
  rm -f "$payload"
  printf 'Render DATABASE_URL updated and deployment started.\n'
else
  printf '%s\n' "$internal_url" > "$TRAMA_ROOT/.secrets/new-database-url"
  printf 'Set DATABASE_URL in the Render service Environment page using .secrets/new-database-url, then deploy the service.\n'
fi
printf '%s\n' "$db_id" > "$TRAMA_DB_FILE"
