#!/usr/bin/env bash
# Deploy Prisma Shop to SSH host big-in (same machine as irogallery).
# Usage:
#   bash deploy/deploy.sh           # from laptop: rsync + remote build
#   bash deploy/deploy.sh --remote  # already on the server
set -euo pipefail

SSH_HOST="big-in"
NGINX_ROOT="/home/amir/sarvestancarpet/devops/nginx"
NGINX_COMPOSE="/home/amir/sarvestancarpet/devops/nginx-compose.yaml"
DATA_DIR="/home/amir/prismashop_data"
SSL_HOST_DIR="${DATA_DIR}/ssl"
DOMAIN="prismashop.ir"

log() { printf '==> %s\n' "$*"; }

reload_nginx() {
  docker exec nginx-sc nginx -t
  docker exec nginx-sc nginx -s reload
}

install_http_vhost() {
  cp deploy/nginx/prismashop.ir.http.conf "${NGINX_ROOT}/conf.d/prismashop.ir.conf"
  rm -f "${NGINX_ROOT}/conf.d/prismashop.ir.ssl.conf"
  cp deploy/nginx/ssl-prismashop.conf "${NGINX_ROOT}/snippets/ssl-prismashop.conf"
  reload_nginx
}

install_https_vhost() {
  cp deploy/nginx/prismashop.ir.conf "${NGINX_ROOT}/conf.d/prismashop.ir.conf"
  cp deploy/nginx/prismashop.ir.ssl.conf "${NGINX_ROOT}/conf.d/prismashop.ir.ssl.conf"
  cp deploy/nginx/ssl-prismashop.conf "${NGINX_ROOT}/snippets/ssl-prismashop.conf"
  reload_nginx
}

ensure_nginx_ssl_volume() {
  mkdir -p "${SSL_HOST_DIR}"
  if grep -q 'ssl-prismashop' "${NGINX_COMPOSE}"; then
    return 0
  fi
  python3 - <<'PY'
from pathlib import Path
p = Path("/home/amir/sarvestancarpet/devops/nginx-compose.yaml")
text = p.read_text()
needle = "      - /sc_data/nginx/ssl-irogallery:/etc/nginx/ssl-irogallery:ro\n"
insert = needle + "      - /home/amir/prismashop_data/ssl:/etc/nginx/ssl-prismashop:ro\n"
if "ssl-prismashop" in text:
    print("ssl-prismashop volume already present")
elif needle not in text:
    raise SystemExit("could not find irogallery ssl volume line in nginx-compose.yaml")
else:
    p.write_text(text.replace(needle, insert, 1))
    print("added ssl-prismashop volume to nginx-compose.yaml")
PY
  (cd /home/amir/sarvestancarpet/devops && docker compose -f nginx-compose.yaml up -d)
}

issue_certificate() {
  local resolved server_ip
  resolved="$(getent hosts "${DOMAIN}" | awk '{print $1; exit}' || true)"
  server_ip="$(hostname -I | awk '{print $1}')"
  if [[ "${resolved}" != "${server_ip}" ]]; then
    log "DNS for ${DOMAIN} is '${resolved}', server is ${server_ip}."
    log "Point the A record to ${server_ip}, then re-run deploy to issue TLS."
    return 0
  fi

  docker run --rm \
    -v /sc_data/certbot/www:/var/www/certbot \
    -v /sc_data/certbot/conf:/etc/letsencrypt \
    certbot/certbot certonly --webroot -w /var/www/certbot \
    -d prismashop.ir -d www.prismashop.ir \
    --email admin@prismashop.ir --agree-tos --non-interactive --keep-until-expiry \
    || {
      log "certbot failed; site remains on HTTP"
      return 0
    }

  mkdir -p "${SSL_HOST_DIR}"
  cp -L /sc_data/certbot/conf/live/prismashop.ir/fullchain.pem "${SSL_HOST_DIR}/fullchain.pem"
  cp -L /sc_data/certbot/conf/live/prismashop.ir/privkey.pem "${SSL_HOST_DIR}/privkey.pem"
  chmod 644 "${SSL_HOST_DIR}/fullchain.pem"
  chmod 600 "${SSL_HOST_DIR}/privkey.pem"
  ensure_nginx_ssl_volume
  install_https_vhost
  log "TLS enabled for ${DOMAIN}"
}

remote_deploy() {
  cd "${HOME}/prismashop"
  mkdir -p "${DATA_DIR}/postgres" "${DATA_DIR}/uploads" "${SSL_HOST_DIR}"
  chmod 777 "${DATA_DIR}/uploads" || true

  if [[ ! -f .env ]]; then
    log "creating .env"
    SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"
    PASS="$(python3 -c 'import secrets; print(secrets.token_urlsafe(18))')"
    cat > .env <<EOF
POSTGRES_USER=prisma
POSTGRES_PASSWORD=${PASS}
POSTGRES_DB=prismashop
SECRET_KEY=${SECRET}
SESSION_COOKIE_SECURE=false
CORS_ORIGINS=https://prismashop.ir,https://www.prismashop.ir,http://prismashop.ir,http://www.prismashop.ir
PUBLIC_BASE_URL=https://prismashop.ir
ADMIN_EMAIL=admin@prismashop.ir
ADMIN_PASSWORD=admin123
NEXT_PUBLIC_API_URL=https://prismashop.ir
PRISMASHOP_DATA_DIR=/home/amir/prismashop_data
NPM_REGISTRY=https://registry.npmmirror.com
EOF
    chmod 600 .env
  fi

  docker network create web_net 2>/dev/null || true
  docker compose build
  docker compose up -d --remove-orphans
  docker image prune -f
  docker compose ps

  if [[ -f "${SSL_HOST_DIR}/fullchain.pem" && -f "${SSL_HOST_DIR}/privkey.pem" ]]; then
    ensure_nginx_ssl_volume
    install_https_vhost
  else
    install_http_vhost
    issue_certificate
  fi
}

if [[ "${1:-}" == "--remote" ]]; then
  remote_deploy
  exit 0
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

log "rsync to ${SSH_HOST}:~/prismashop"
rsync -avz --delete \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='backend/.venv' \
  --exclude='backend/uploads' \
  --exclude='*.log' \
  --exclude='.cursor' \
  -e ssh \
  ./ "${SSH_HOST}:prismashop/"

log "building on ${SSH_HOST}"
ssh "${SSH_HOST}" 'bash "$HOME/prismashop/deploy/deploy.sh" --remote'
log "deploy complete"
