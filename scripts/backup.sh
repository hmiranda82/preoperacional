#!/usr/bin/env bash
set -euo pipefail

# ───────────────────────────────────────────────────────────
# backup.sh — Backup de la base de datos MySQL (docker)
# Guarda en ./backups/ con timestamp, rota >30 días.
# Opcional: sube a S3 si AWS_S3_BUCKET está definido.
# ───────────────────────────────────────────────────────────

cd "$(dirname "$0")/.."

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/preoperacional_db_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# ── 1. Obtener password desde .env ────────────────────────
if [ ! -f .env ]; then
  echo "Error: archivo .env no encontrado en $(pwd)"
  exit 1
fi

# shellcheck disable=SC2046
export $(grep -v '^\s*#' .env | grep -v '^\s*$' | xargs)

DB_NAME="preoperacional_db"
DB_USER="${MYSQL_USER:-preop_user}"
DB_PASS="${MYSQL_APP_PASSWORD}"
DB_CONTAINER="preoperacional-db"

if [ -z "${DB_PASS}" ]; then
  echo "Error: MYSQL_APP_PASSWORD no está definido en .env"
  exit 1
fi

# ── 2. Ejecutar mysqldump y comprimir ─────────────────────
echo "⏺ Respaldando ${DB_NAME} desde ${DB_CONTAINER}..."

docker compose exec -T db mysqldump \
  -u "${DB_USER}" \
  -p"${DB_PASS}" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  "${DB_NAME}" 2>/dev/null | gzip > "${BACKUP_FILE}"

# Validar que no esté vacío
if [ ! -s "${BACKUP_FILE}" ]; then
  rm -f "${BACKUP_FILE}"
  echo "Error: el backup generado está vacío"
  exit 1
fi

echo "✓ Backup creado: ${BACKUP_FILE}"
echo "  Tamaño: $(du -h "${BACKUP_FILE}" | cut -f1)"

# ── 3. Rotar backups > 30 días ────────────────────────────
echo "🗑 Limpiando backups con más de 30 días..."
find "${BACKUP_DIR}" -name 'preoperacional_db_*.sql.gz' -type f -mtime +30 -delete

# ── 4. Subir a S3/compatible (opcional) ──────────────────
if [ -n "${AWS_S3_BUCKET:-}" ]; then
  if command -v aws &>/dev/null; then
    echo "☁ Subiendo a S3://${AWS_S3_BUCKET}..."
    aws s3 cp "${BACKUP_FILE}" "s3://${AWS_S3_BUCKET}/database/"
    echo "✓ Subida completada"
  else
    echo "⚠ aws CLI no encontrado. Instálalo para subir a S3."
  fi
fi

echo ""
echo "✓ Backup finalizado: $(date)"
