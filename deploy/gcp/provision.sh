#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y awscli caddy gnupg sqlite3

device=/dev/disk/by-id/google-trama-data
mount_point=/mnt/disks/trama-data
if ! blkid "$device" >/dev/null 2>&1; then
  mkfs.ext4 -F -m 0 "$device"
fi
mkdir -p "$mount_point"
uuid=$(blkid -s UUID -o value "$device")
if ! grep -q "UUID=$uuid" /etc/fstab; then
  printf 'UUID=%s %s ext4 defaults,nofail,discard 0 2\n' "$uuid" "$mount_point" | tee -a /etc/fstab >/dev/null
fi
mount -a

if ! getent group trama >/dev/null; then
  groupadd --system --gid 10001 trama
fi
if ! id trama >/dev/null 2>&1; then
  useradd --system --uid 10001 --gid trama --home-dir /nonexistent --shell /usr/sbin/nologin trama
fi
install -d -o trama -g trama -m 0700 "$mount_point"
install -d -o root -g root -m 0755 /opt/trama/releases
install -d -o root -g trama -m 0750 /etc/trama
