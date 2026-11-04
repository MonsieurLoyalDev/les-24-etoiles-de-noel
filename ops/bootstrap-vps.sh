#!/usr/bin/env bash
# PREPARATION ONLY until the owner approves the audited plan.
# Creates only the dedicated account/directories/tools. No web/PM2/DB signals.
set -euo pipefail
if [[ ${1:-} != --apply-approved || ${2:-} != --ssh-user || ${3:-} != ubuntu || $# -ne 3 ]]; then
  printf '%s\n' 'Usage after approval: sudo bash bootstrap-vps.sh --apply-approved --ssh-user ubuntu' >&2
  exit 1
fi
if [[ $(id -u) -ne 0 ]]; then printf '%s\n' 'Root required for approved bootstrap only.' >&2; exit 1; fi
if [[ $(/usr/bin/node --version) != v22.22.3 ]]; then printf '%s\n' 'Node differs from audited version; re-audit, do not upgrade automatically.' >&2; exit 1; fi
systemctl is-active --quiet nginx
id ubuntu >/dev/null
if getent passwd etoilebois >/dev/null || getent group etoilebois >/dev/null; then
  printf '%s\n' 'Dedicated user/group already exists; inspect it before proceeding.' >&2; exit 1
fi
for path in /var/www/etoilebois /var/lib/etoilebois /etc/etoilebois /var/backups/etoilebois /usr/local/lib/etoilebois; do
  if [[ -e "$path" || -L "$path" ]]; then printf 'Existing target refused: %s\n' "$path" >&2; exit 1; fi
done
for parent in /var/www /var/lib /etc /var/backups /usr/local/lib; do
  if [[ $(readlink -f "$parent") != "$parent" || ! -d "$parent" ]]; then printf 'Unexpected parent path: %s\n' "$parent" >&2; exit 1; fi
done
SOURCE_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
for file in release.mjs nginx.mjs lib/artifact.mjs cert-renew-hook.sh; do
  if [[ ! -f "$SOURCE_DIR/$file" || -L "$SOURCE_DIR/$file" ]]; then printf 'Missing/linked approved tool: %s\n' "$file" >&2; exit 1; fi
done
# All preflight checks completed before any account/path modification.
useradd --system --user-group --create-home --home-dir /var/lib/etoilebois --shell /usr/sbin/nologin etoilebois
install -d -m 0755 -o etoilebois -g etoilebois /var/lib/etoilebois /var/www/etoilebois
install -d -m 2750 -o ubuntu -g etoilebois /var/lib/etoilebois/inbox
install -d -m 0700 -o etoilebois -g etoilebois /etc/etoilebois /var/backups/etoilebois
install -d -m 0755 /usr/local/lib/etoilebois/ops/lib
install -m 0644 "$SOURCE_DIR/release.mjs" "$SOURCE_DIR/nginx.mjs" "$SOURCE_DIR/cert-renew-hook.sh" /usr/local/lib/etoilebois/ops/
install -m 0644 "$SOURCE_DIR/lib/artifact.mjs" /usr/local/lib/etoilebois/ops/lib/
runuser -u etoilebois -- /usr/bin/node /usr/local/lib/etoilebois/ops/release.mjs init /var/www/etoilebois --confirm-init
printf '%s\n' 'Dedicated paths initialized. No package installed, service reloaded, PM2 changed or DB contacted. Nginx/certificate deployment requires the separate approved steps.'
