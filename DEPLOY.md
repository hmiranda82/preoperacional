# Runbook de despliegue en producción

Guía paso a paso para llevar el sistema a un VPS (Hostinger KVM recomendado).
Arquitectura: 4 contenedores Docker — `db` (MySQL 8), `backend` (NestJS),
`frontend` (panel nginx), `caddy` (reverse proxy + SSL automático).

> ⚠️ **Regla de oro**: los secretos SOLO viven en el `.env` del VPS.
> Nunca en el repositorio, nunca en chats, nunca reutilizados de otro entorno.

---

## 0. Contratar y preparar el VPS

| Escenario | Plan Hostinger |
|---|---|
| Arranque gradual (< 500 conductores activos) | **KVM 2** — 2 vCPU / 8 GB RAM / 100 GB NVMe |
| Operación plena (hasta 2000 conductores + fotos diarias) | **KVM 4** — 4 vCPU / 16 GB RAM / 200 GB NVMe |

**Con 2000 conductores subiendo fotos por inspección, el disco es el recurso
crítico.** Si el volumen de fotos crece rápido, migrate los uploads a object
storage (ver §6) en vez de cambiar de plan.

1. Contrata el VPS y elige Ubuntu 24.04 LTS.
2. Apunta el DNS: `dominio.com`, `admin.dominio.com` y `api.dominio.com` → IP del VPS (A records).
3. Instala Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
4. Clona el repositorio en `/opt/preoperacional` (o clona en tu PC y copia con `git push`/`scp`).

## 1. Preparar secretos (en el VPS)

```bash
cd /opt/preoperacional
cp .env.production.example .env
nano .env
```

Llena los valores. Genera cada secreto nuevo y distinto:

```bash
openssl rand -base64 24   # MYSQL_ROOT_PASSWORD
openssl rand -base64 24   # MYSQL_APP_PASSWORD
openssl rand -hex 64      # JWT_SECRET
openssl rand -base64 24   # SUPER_ROOT_PASSWORD (temporal del seed)
```

- `RUN_SEED=true` **solo para el primer arranque** (ver §3).
- `SUPER_ROOT_PASSWORD` es la contraseña **temporal** de `root@system.local`;
  el sistema obligará a cambiarla en el primer login.
- NO reutilices ninguna contraseña de desarrollo.

## 2. Primer arranque

```bash
docker compose up -d
docker compose logs -f backend   # espera: "Migrations complete." + "Seed complete." + "Starting server"
```

El entrypoint ejecuta automáticamente:
1. `prisma migrate deploy` — crea el esquema de las 17 tablas.
2. `node dist/seed.js` — **solo si `RUN_SEED=true`**: siembra empresa +
   formulario (12 preguntas) + **único usuario** `root@system.local`
   con `mustChangePassword=true`.
3. Arranca la API con el filtro global de errores y la validación
   fail-fast del entorno (si falta `JWT_SECRET` o `CORS_ORIGINS`, no arranca).

Verifica:
```bash
curl https://api.dominio.com/api/health        # {"status":"ok","database":"connected"}
```

## 3. Primer login (cambio forzado de contraseña)

1. Abre `https://admin.dominio.com` → login SUPER_ROOT →
   `root@system.local` / la contraseña temporal del `.env`.
2. El sistema **redirige automáticamente** a cambiar contraseña y el backend
   bloquea toda la API (`403 PASSWORD_CHANGE_REQUIRED`) hasta completarla.
   El nuevo password debe cumplir la política (longitud, banlist, sin datos
   personales, sin secuencias).
3. Al cambiarla: sesión nueva liberada, las sesiones previas se revocan.

## 4. Crear los ADMIN de la empresa

Aún como SUPER_ROOT en el panel:
1. **Usuarios → Nuevo usuario → rol ADMIN**, empresa, cédula, nombre, correo y
   contraseña temporal (cumple la política).
2. Todo usuario creado recibe `mustChangePassword=true`: el admin deberá
   cambiar su contraseña en su primer inicio (misma mecánica que el §3).
3. Cada ADMIN configura formularios/conductores de su empresa. Los conductores
   creados por el panel también arrancan con cambio forzado (la app móvil
   `CambiarClaveView` lo gestiona).

## 5. Cerrar el bootstrap

```bash
# en .env
RUN_SEED=false
```

El seed es idempotente y seguro (nunca reescribe contraseñas ni re-activa el
cambio forzado), pero déjalo en `false` como estado estable.

## 6. Backups automáticos

El script `scripts/backup.sh` hace dump consistente de MySQL + empaqueta las
fotos del volumen `uploads`, con retención de 30 días y copia externa opcional
(`BACKUP_REMOTE` vía rsync — **el backup nunca debe vivir solo en el VPS**):

```bash
chmod +x /opt/preoperacional/scripts/backup.sh
sudo tee /etc/cron.d/preoperacional-backup <<'EOF'
0 3 * * * root /opt/preoperacional/scripts/backup.sh >> /var/log/preoperacional-backup.log 2>&1
EOF
```

Prueba una restauración antes de dar el despliegue por terminado.

## 7. Checklist final de producción

- [ ] `https://api.dominio.com/api/health` → `status: ok`
- [ ] Login SUPER_ROOT con cambio forzado completado (contraseña nueva ≠ temporal)
- [ ] `RUN_SEED=false` en el `.env`
- [ ] Al menos 1 ADMIN creado y con su contraseña cambiada en primer login
- [ ] Formulario preoperacional visible con sus 12 preguntas
- [ ] Cron de backups activo y probado (restauración de prueba)
- [ ] Certificados SSL activos (Caddy los emite solo; verifica candado en los 2 dominios)
- [ ] Sentry (opcional) reportando errores
