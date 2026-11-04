#!/usr/bin/env bash
# Read-only. Does not invoke PM2 CLI: it can start a daemon when none exists.
set -uo pipefail
section() { printf '\n## %s\n' "$1"; }
section 'System'; cat /etc/os-release 2>/dev/null; uname -r; id; date -Is
section 'Resources'; uptime; getconf _NPROCESSORS_ONLN; free -h; df -h / /var/www 2>/dev/null
section 'Versions'; node --version 2>/dev/null; npm --version 2>/dev/null
if command -v pm2 >/dev/null; then
  PM2_BIN=$(readlink -f "$(command -v pm2)")
  PM2_PACKAGE=$(dirname "$(dirname "$PM2_BIN")")/package.json
  node -e 'try{console.log("PM2 installed:",JSON.parse(require("fs").readFileSync(process.argv[1])).version)}catch{console.log("PM2 package version unavailable")}' "$PM2_PACKAGE"
fi
section 'Running services (no command arguments or environment)'
ps -eo user,pid,comm --sort=user
for unit in nginx apache2 caddy postgresql; do systemctl is-active "$unit" 2>/dev/null || true; done
section 'Ports'; ss -lntup 2>/dev/null
section 'PM2 snapshots (names/status only; may be stale)'
PM2_DIR=${PM2_HOME:-"$HOME/.pm2"}
if [[ -f "$PM2_DIR/dump.pm2" ]]; then
  node -e 'try{const fs=require("fs");for(const p of JSON.parse(fs.readFileSync(process.argv[1])))console.log(JSON.stringify({name:p.name,pid:p.pid,status:p.status??p.pm2_env?.status}))}catch{console.log("PM2 snapshot unreadable or invalid; no raw data displayed")}' "$PM2_DIR/dump.pm2"
fi
printf '%s\n' 'Live PM2 details require the owning user and a running daemon. No pm2 list/jlist/show/save/start was invoked.'
section 'Web server binaries'; command -v nginx apache2 caddy certbot 2>/dev/null
section 'Domain/listen/certificate directives only (not complete configs)'
for dir in /etc/nginx /etc/apache2 /etc/caddy; do
  if [[ -d "$dir" ]]; then
    find "$dir" -maxdepth 3 -type f -name '*.conf' -exec grep -HnE '^[[:space:]]*(server_name|listen|ssl_certificate[[:space:]]|ServerName|ServerAlias)' {} + 2>/dev/null || true
  fi
done
section 'Certificate public metadata only'
if [[ -d /etc/letsencrypt/live ]]; then
  find /etc/letsencrypt/live -maxdepth 2 -name cert.pem -exec openssl x509 -in {} -noout -subject -issuer -dates \; 2>/dev/null || true
fi
section 'Caddy configuration presence'; test ! -f /etc/caddy/Caddyfile || stat -c '%n %U %a' /etc/caddy/Caddyfile
section 'DNS (optional domain argument)'
if [[ ${1:-} =~ ^[A-Za-z0-9.-]+$ ]]; then getent ahosts "$1"; fi
section 'End'; printf '%s\n' 'No installation, configuration write, service signal or PM2 modification performed. Permission-denied sections remain unaudited.'
