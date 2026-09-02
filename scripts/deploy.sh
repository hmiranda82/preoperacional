#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────
# deploy.sh — Despliegue del proyecto Preoperacional
# Uso: ./scripts/deploy.sh <usuario> <host> <dominio>
# ──────────────────────────────────────────────────────

if [ $# -lt 3 ]; then
  echo "Uso: $0 <usuario> <host> <dominio>"
  echo "Ej:  $0 deploy 123.123.123.123 preoperacional.com"
  exit 1
fi

USUARIO="$1"
HOST="$2"
DOMINIO="$3"
SSH_DEST="${USUARIO}@${HOST}"
REMOTE_DIR="/home/${USUARIO}/preoperacional"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${REMOTE_DIR}/deploy_backups/${TIMESTAMP}"

echo "=== Preoperacional Deploy ==="
echo "  Host:    ${HOST}"
echo "  Usuario: ${USUARIO}"
echo "  Dominio: ${DOMINIO}"
echo "=============================="

# ── 1. Sincronizar código (rsync excluye basura) ──────
echo "[1/5] Sincronizando código..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.zip' \
  --exclude='.env' \
  --exclude='backups' \
  --exclude='deploy_backups' \
  -e ssh \
  ./ "${SSH_DEST}:${REMOTE_DIR}/"

# ── 2. Backup del estado actual en el servidor ────────
echo "[2/5] Respaldando deploy actual..."
ssh "${SSH_DEST}" "mkdir -p ${BACKUP_DIR} && \
  if [ -f ${REMOTE_DIR}/docker-compose.yml ]; then
    cp ${REMOTE_DIR}/docker-compose.yml ${BACKUP_DIR}/
    docker compose -f ${REMOTE_DIR}/docker-compose.yml images > ${BACKUP_DIR}/images.txt 2>/dev/null || true
  fi"

# ── 3. Construir imágenes en el servidor ──────────────
echo "[3/5] Construyendo imágenes Docker..."
ssh "${SSH_DEST}" "cd ${REMOTE_DIR} && \
  DOMINIO=${DOMINIO} docker compose build --pull"

# ── 4. Detener servicio anterior y levantar nuevo ─────
echo "[4/5] Desplegando servicios..."
ssh "${SSH_DEST}" "cd ${REMOTE_DIR} && \
  DOMINIO=${DOMINIO} docker compose up -d --remove-orphans"

# ── 5. Healthchecks ────────────────────────────────────
echo "[5/5] Esperando healthchecks..."
sleep 15

HEALTH_OK=true
for service in backend frontend db; do
  STATUS=$(ssh "${SSH_DEST}" "docker inspect --format='{{.State.Health.Status}}' preoperacional-${service} 2>/dev/null || echo 'no-healthcheck'")
  echo "  preoperacional-${service}: ${STATUS}"

  if [ "${STATUS}" = "unhealthy" ]; then
    HEALTH_OK=false
    echo "  ✗ ${service} está unhealthy!"
  fi
done

if [ "${HEALTH_OK}" = false ]; then
  echo ""
  echo "✗ Healthchecks fallaron. Iniciando rollback..."

  ssh "${SSH_DEST}" "cd ${REMOTE_DIR} && \
    docker compose logs --tail=50 backend frontend > ${BACKUP_DIR}/failed-logs.txt && \
    docker compose down"

  # Restaurar backup si existe
  ssh "${SSH_DEST}" "if [ -f ${BACKUP_DIR}/docker-compose.yml ]; then
    cp ${BACKUP_DIR}/docker-compose.yml ${REMOTE_DIR}/docker-compose.yml
    cd ${REMOTE_DIR} && DOMINIO=${DOMINIO} docker compose up -d
  fi"

  echo "Rollback completado. Revisa ${BACKUP_DIR}/failed-logs.txt"
  exit 1
fi

echo ""
echo "✓ Deploy completado exitosamente!"
echo "  API:     https://api.${DOMINIO}/health"
echo "  Admin:   https://admin.${DOMINIO}"
echo "  Fecha:   $(date)"
