#!/bin/sh
# ─────────────────────────────────────────────────────────────
# PREOPERACIONAL — Backup diario (BD + fotos)
# ─────────────────────────────────────────────────────────────
# Ejecutar desde cron del VPS. Requiere Docker con el stack levantado.
#
# Cron sugerido (03:00 UTC = 22:00 Colombia):
#   0 3 * * * /opt/preoperacional/scripts/backup.sh >> /var/log/preoperacional-backup.log 2>&1
#
# Variables opcionales:
#   BACKUP_DIR       destino local (default ./backups; en VPS usar /var/backups/preoperacional)
#   RETENTION_DAYS   días de retención (default 30)
#   BACKUP_REMOTE    destino rsync remoto (ej: user@backup-host:/backups/preoperacional/)
#                    — el backup NUNCA debe vivir solo en el VPS
# ─────────────────────────────────────────────────────────────
set -eu

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

# 1) Dump consistente de MySQL.
# Credenciales leídas del propio contenedor db (MYSQL_USER/MYSQL_PASSWORD
# vienen del .env vía docker-compose; nunca se escriben en claro aquí).
docker compose exec -T db sh -c \
  'exec mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --single-transaction --routines --triggers --events "$MYSQL_DATABASE"' \
  | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"

# Validar que el dump no esté vacío (fallar fuerte, no dejar un backup tumba)
if [ ! -s "$BACKUP_DIR/db-$DATE.sql.gz" ]; then
  rm -f "$BACKUP_DIR/db-$DATE.sql.gz"
  echo "[backup] ERROR: el dump de la BD quedó vacío" >&2
  exit 1
fi
echo "[backup] dump BD: db-$DATE.sql.gz"

# 2) Fotos de inspecciones (volumen uploads montado en preoperacional-api)
docker run --rm --volumes-from preoperacional-api -v "$(cd "$BACKUP_DIR" && pwd)":/backup alpine:3 \
  sh -c "tar czf /backup/uploads-$DATE.tar.gz -C /app/uploads ."

if [ ! -s "$BACKUP_DIR/uploads-$DATE.tar.gz" ]; then
  rm -f "$BACKUP_DIR/uploads-$DATE.tar.gz"
  echo "[backup] ERROR: el paquete de uploads quedó vacío" >&2
  exit 1
fi
echo "[backup] fotos: uploads-$DATE.tar.gz"

# 3) Retención: elimina backups más viejos que RETENTION_DAYS
find "$BACKUP_DIR" -type f \( -name 'db-*.sql.gz' -o -name 'uploads-*.tar.gz' \) -mtime "+$RETENTION_DAYS" -delete

# 4) Copia externa opcional
if [ -n "${BACKUP_REMOTE:-}" ]; then
  rsync -az --partial "$BACKUP_DIR/" "$BACKUP_REMOTE"
  echo "[backup] copia remota sincronizada -> $BACKUP_REMOTE"
fi

echo "[backup] OK $DATE"
