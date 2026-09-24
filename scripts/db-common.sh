#!/usr/bin/env bash
set -euo pipefail

TRAMA_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
TRAMA_DB_FILE="$TRAMA_ROOT/.secrets/current-db-id"
TRAMA_KEY_FILE="$TRAMA_ROOT/.secrets/backup-passphrase"
TRAMA_ACCESS_CHANGED=0
TRAMA_OLD_RULES=()

trama_current_db_id() {
  if [[ -n "${TRAMA_DB_ID:-}" ]]; then
    printf '%s\n' "$TRAMA_DB_ID"
  else
    cat "$TRAMA_DB_FILE"
  fi
}

trama_open_access() {
  local db_id=$1 ip rule
  TRAMA_ACCESS_DB_ID=$db_id
  mapfile -t TRAMA_OLD_RULES < <(render postgres get "$db_id" --output json | jq -r '.data.ipAllowList[] | "cidr=\(.cidrBlock),description=\(.description)"')
  ip=$(curl -4fsS https://api.ipify.org)
  if ! [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    printf 'Could not determine a valid IPv4 address.\n' >&2
    return 1
  fi
  local -a args=()
  for rule in "${TRAMA_OLD_RULES[@]}"; do args+=(--ip-allow-list "$rule"); done
  args+=(--ip-allow-list "cidr=$ip/32,description=trama-backup-temporary")
  render postgres update "$db_id" "${args[@]}" --confirm --output json >/dev/null
  TRAMA_ACCESS_CHANGED=1
}

trama_close_access() {
  if [[ "$TRAMA_ACCESS_CHANGED" != 1 ]]; then return 0; fi
  if [[ ${#TRAMA_OLD_RULES[@]} -eq 0 ]]; then
    render postgres update "$TRAMA_ACCESS_DB_ID" --clear-ip-allow-list --confirm --output json >/dev/null
  else
    local rule
    local -a args=()
    for rule in "${TRAMA_OLD_RULES[@]}"; do args+=(--ip-allow-list "$rule"); done
    render postgres update "$TRAMA_ACCESS_DB_ID" "${args[@]}" --confirm --output json >/dev/null
  fi
  TRAMA_ACCESS_CHANGED=0
}

trama_connection_url() {
  local db_id=$1 kind=$2
  render postgres get "$db_id" --include-sensitive-connection-info --output json |
    jq -er ".data.connectionInfo.${kind}ConnectionString"
}
