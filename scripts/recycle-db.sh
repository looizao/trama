#!/usr/bin/env bash
set -euo pipefail
source "$(dirname -- "${BASH_SOURCE[0]}")/db-common.sh"

old_id=$(trama_current_db_id)
meta=$(render postgres get "$old_id" --output json)
expiry=$(printf '%s' "$meta" | jq -er '.data.expiresAt')
expiry_epoch=$(date -u -d "$expiry" +%s)
now_epoch=$(date -u +%s)
if (( now_epoch < expiry_epoch )); then
  printf 'Current free database remains active until %s. Back up again near expiry; recycling before then would require deleting it.\n' "$expiry" >&2
  exit 1
fi
archive=${1:-$(find "$TRAMA_ROOT/backups" -maxdepth 1 -name 'trama-*.dump.gpg' -type f | sort | tail -n 1)}
if [[ -z "$archive" || ! -f "$archive" ]]; then
  printf 'No encrypted backup found.\n' >&2
  exit 1
fi
age=$(( now_epoch - $(stat -c %Y "$archive") ))
if (( age > 48 * 3600 )) && [[ "${TRAMA_ALLOW_OLD_BACKUP:-}" != true ]]; then
  printf 'Newest backup is more than 48 hours old. Set TRAMA_ALLOW_OLD_BACKUP=true only if losing later changes is acceptable.\n' >&2
  exit 1
fi
gpg --batch --quiet --pinentry-mode loopback --passphrase-file "$TRAMA_KEY_FILE" --decrypt "$archive" |
  pg_restore --no-owner --no-privileges --file=/dev/null
new_meta=$(render postgres create --confirm --name "trama-prototype-db-$(date -u +%Y%m%d)" --plan free --version 18 --region virginia --database-name trama --database-user trama --output json)
new_id=$(printf '%s' "$new_meta" | jq -er '.data.id // .id')
printf 'Created replacement free database: %s\n' "$new_id"
for attempt in $(seq 1 60); do
  status=$(render postgres get "$new_id" --output json | jq -r '.data.status')
  if [[ "$status" == available ]]; then break; fi
  sleep 10
done
if [[ "$status" != available ]]; then
  printf 'Replacement database is not available yet. Retry restore when it becomes available.\n' >&2
  exit 1
fi
"$TRAMA_ROOT/scripts/restore-db.sh" "$archive" "$new_id"
