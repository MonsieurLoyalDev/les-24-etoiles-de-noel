#!/usr/bin/env bash
# Install root-owned only after audit/approval. Restricted to this certificate.
set -euo pipefail
if [[ ${RENEWED_LINEAGE:-} != /etc/letsencrypt/live/etoilebois.loyaldev.fr ]]; then exit 0; fi
/usr/sbin/nginx -t
/usr/bin/systemctl reload nginx
