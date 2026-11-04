#!/usr/bin/env bash
# Read-only follow-up. No service signals or configuration writes.
set -uo pipefail
printf '\n## Node executable and directory permissions\n'
command -v node
NODE_PATH_AUDIT=$(command -v node)
readlink -f "$NODE_PATH_AUDIT"
namei -l "$NODE_PATH_AUDIT" 2>/dev/null || true
printf '\n## Enabled Nginx files\n'
find /etc/nginx/sites-enabled -maxdepth 1 -printf '%f -> %l\n' 2>/dev/null
printf '\n## Selected directives only, including extensionless files\n'
for config in /etc/nginx/nginx.conf /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*; do
  [[ -f "$config" ]] || continue
  printf '\nFILE %s\n' "$config"
  awk '{sub(/#.*/, "");print}' "$config" 2>/dev/null | awk 'BEGIN{RS="[;{}]"}{gsub(/^[[:space:]]+|[[:space:]]+$/, "");if($0 ~ /^(server_name|listen|root|ssl_certificate|include)[[:space:]]/)print}'
done
printf '\n## Existing public certificate metadata (sudo read only)\n'
sudo -n find /etc/letsencrypt/live -maxdepth 2 -name cert.pem -exec openssl x509 -in {} -noout -subject -issuer -dates -ext subjectAltName \; 2>/dev/null || printf '%s\n' 'Public certificate metadata not readable; this remains unaudited.'
printf '\n## Certificate renewal timer state\n'
systemctl list-timers --all '*certbot*' 2>/dev/null || true
printf '\n## Current PM2 summary, only if the existing owning daemon is alive\n'
PM2_DIR=${PM2_HOME:-"$HOME/.pm2"}
PM2_DAEMON_PID=$(cat "$PM2_DIR/pm2.pid" 2>/dev/null || true)
if [[ $PM2_DAEMON_PID =~ ^[0-9]+$ ]] && kill -0 "$PM2_DAEMON_PID" 2>/dev/null && [[ $(cat "/proc/$PM2_DAEMON_PID/comm" 2>/dev/null) == PM2* ]]; then
  pm2 jlist | node -e 'let s="";process.stdin.setEncoding("utf8");process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{try{for(const p of JSON.parse(s))console.log(JSON.stringify({name:p.name,pid:p.pid,status:p.pm2_env?.status,restarts:p.pm2_env?.restart_time,uptime:p.pm2_env?.pm_uptime,node:p.pm2_env?.node_version,interpreter:p.pm2_env?.exec_interpreter,memory:p.monit?.memory,cpu:p.monit?.cpu}))}catch{console.log("PM2 summary could not be parsed; raw environment omitted")}})'
else
  printf '%s\n' 'No confirmed existing daemon for this user; PM2 CLI not invoked.'
fi
printf '\n## End: no installation/reload/restart performed\n'
