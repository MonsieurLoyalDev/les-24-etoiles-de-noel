import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
export function nginxConfig(
  domain,
  backend,
  {
    tls = true,
    certDir = "/etc/letsencrypt/live",
    port = 443,
    httpPort = 80,
    root = "/var/www/etoilebois",
  } = {},
) {
  if (
    !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62}$/.test(
      domain,
    )
  )
    throw Error("Invalid domain");
  const url = new URL(backend);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw Error("HTTPS backend origin required");
  for (const p of [root, certDir])
    if (!/^\/[A-Za-z0-9_./-]+$/.test(p) || p.includes(".."))
      throw Error("Invalid config path");
  for (const p of [port, httpPort])
    if (!Number.isInteger(p) || p < 1 || p > 65535) throw Error("Invalid port");
  const acme = `location ^~ /.well-known/acme-challenge/ { root ${root}/acme; try_files $uri =404; }`;
  const http = `server {\n listen ${httpPort};\n server_name ${domain};\n ${acme}\n location / { ${tls ? `return 301 https://${domain}$request_uri;` : 'return 503 "etoilebois: awaiting HTTPS activation\\n";'} }\n}\n`;
  if (!tls) return http;
  return (
    http +
    `server {
 listen ${port} ssl;
 server_name ${domain};
 root ${root}/current/site;
 index index.html;
 open_file_cache off;
 ssl_certificate ${certDir}/${domain}/fullchain.pem;
 ssl_certificate_key ${certDir}/${domain}/privkey.pem;
 ssl_protocols TLSv1.2 TLSv1.3;
 server_tokens off;
 access_log /var/log/nginx/etoilebois-access.log;
 error_log /var/log/nginx/etoilebois-error.log;
 add_header X-Content-Type-Options "nosniff" always;
 add_header Referrer-Policy "no-referrer" always;
 add_header X-Frame-Options "DENY" always;
 add_header Strict-Transport-Security "max-age=31536000" always;
 add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${url.origin}; media-src 'self' blob: ${url.origin}; connect-src 'self' ${url.origin} https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; font-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" always;
 location = /healthz { access_log off; default_type text/plain; return 200 "etoilebois-static\\n"; }
 location ~ /\\. { return 404; }
 location ~* ^/(src|supabase|ops|backups|private|media|surprises|demo|node_modules)(/|$) { return 404; }
 location ~* \\.(sql|dump|env|map|bak|enc)$ { return 404; }
 location = /build-info.json { return 404; }
 location = /release-manifest.json { return 404; }
 location = /index.html { expires -1; etag off; if_modified_since off; try_files $uri =404; }
 location ~* ^/assets/[A-Za-z0-9_-]+-[A-Za-z0-9_-]{8,}\\.(js|css|woff2?|png|webp)$ { expires 1y; try_files $uri @historic_asset; }
 location /assets/ { expires 5m; try_files $uri =404; }
 location @historic_asset { internal; root ${root}/historic; expires 1y; try_files $uri =404; }
 location / { try_files $uri $uri/ /index.html; }
}
`
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const [domain, backend, out, mode] = process.argv.slice(2);
    if (!out)
      throw Error("Usage: nginx.mjs DOMAIN SUPABASE_ORIGIN OUTPUT [http]");
    writeFileSync(out, nginxConfig(domain, backend, { tls: mode !== "http" }), {
      flag: "wx",
      mode: 0o600,
    });
    console.log(
      "Generated only; no Nginx configuration installed or reloaded.",
    );
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
