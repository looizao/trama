#!/usr/bin/env bash
set -euo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/db-common.sh"

command -v render >/dev/null
command -v pg_dump >/dev/null
command -v pg_restore >/dev/null
command -v gpg >/dev/null
command -v jq >/dev/null
umask 077
mkdir -p "$TRAMA_ROOT/backups" "$TRAMA_ROOT/.secrets"
if [[ ! -s "$TRAMA_KEY_FILE" ]]; then
  openssl rand -hex 32 > "$TRAMA_KEY_FILE"
fi

db_id=$(trama_current_db_id)
archive="$TRAMA_ROOT/backups/trama-$(date -u +%Y%m%dT%H%M%SZ).dump.gpg"
trap 'trama_close_access' EXIT
trama_open_access "$db_id"
db_url=$(trama_connection_url "$db_id" external)
if ! PGSSLMODE=require PGCONNECT_TIMEOUT=15 pg_dump --format=custom --compress=6 --no-owner --no-privileges --dbname="$db_url" |
  gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-file "$TRAMA_KEY_FILE" --symmetric --cipher-algo AES256 --output "$archive"; then
  rm -f "$archive"
  exit 1
fi
if ! gpg --batch --quiet --pinentry-mode loopback --passphrase-file "$TRAMA_KEY_FILE" --decrypt "$archive" |
  pg_restore --no-owner --no-privileges --file=/dev/null; then
  rm -f "$archive"
  exit 1
fi
trama_close_access
printf 'Verified encrypted backup: %s (%s bytes)\n' "$archive" "$(stat -c %s "$archive")"
