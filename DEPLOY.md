# Runbook de despliegue en producción

Guía paso a paso para llevar el sistema a un VPS (Hostinger KVM recomendado).
Arquitectura: 4 contenedores Docker — `db` (MySQL 8), `backend` (NestJS),
`frontend` (panel nginx), `caddy` (reverse proxy + SSL automático).
Redes: `internal` (aislada, solo backend↔db) y `public` (backend · frontend · caddy).

> ⚠️ **Regla de oro**: los secretos SOLO viven en el `.env` del VPS.
> Nunca en el repositorio, nunca en chats, nunca reutilizados de otro entorno.

> Este documento solo explica el despliegue. No modifica el código del
> aplicativo: los contenedores, la base de datos y el flujo de seed ya están
> implementados y funcionando en el repositorio.

---

## 0. Contratar y preparar el VPS

| Escenario | Plan Hostinger |
|---|---|
| Arranque gradual (< 500 conductores activos) | **KVM 2** — 2 vCPU / 8 GB RAM / 100 GB NVMe |
| Operación plena (hasta 2000 conductores + fotos diarias) | **KVM 4** — 4 vCPU / 16 GB RAM / 200 GB NVMe |

**Con 2000 conductores subiendo fotos por inspección, el disco es el recurso
crítico.** Si el volumen de fotos crece rápido, migra los uploads a object
storage (ver §9) en vez de cambiar de plan.

### 0.1 Contratar
1. Contrata el VPS y elige **Ubuntu 24.04 LTS**.
2. Crea una **llave SSH** en tu PC y súbela al VPS (o usa la contraseña que te
   generen; preferiblemente SSH key).

### 0.2 Firewall (HACER ANTES de abrir puertos)
```bash
ufw default deny incoming
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP (Caddy redirige a HTTPS)
ufw allow 443/tcp     # HTTPS
ufw enable
```

> Solo se abren `22`, `80` y `443`. MySQL (3306) y la API (3002) **no** se
> exponen al host: el `docker-compose.yml` no publica esos puertos y solo son
> alcanzables dentro de la red de Docker. No los abras al firewall jamás.

### 0.3 Instalar Docker y git
```bash
curl -fsSL https://get.docker.com | sh
apt install -y git
docker compose version   # debe responder a "v2.x"
```

### 0.4 Clonar el proyecto
```bash
mkdir -p /opt/preoperacional
git clone <URL_DEL_REPO> /opt/preoperacional
cd /opt/preoperacional
```
(Si no usas git, copia la carpeta `VERSION-12` con `scp -r`.)

---

## 1. Apuntar el DNS

Crea los registros **A** apuntando a la IP del VPS (en el panel DNS de tu
dominio):

```
dominio.com        → IP_DEL_VPS
admin.dominio.com  → IP_DEL_VPS
api.dominio.com    → IP_DEL_VPS
```

**Antes de arrancar con Caddy**, verifica que el DNS ya propagó. Caddy (Let's
Encrypt) aplica límites de peticiones por dominio; si arranca con DNS sin
propagar puede quedarse bloqueado el SSL temporalmente:

```bash
dig +short admin.dominio.com
dig +short api.dominio.com
# deben devolver la IP del VPS
```

Caddy usará el correo `admin@tu-dominio.com` para el ACME SSL (ver `Caddyfile`).

---

## 2. Preparar secretos (en el VPS)

```bash
cd /opt/preoperacional
cp .env.production.example .env
nano .env
```

Llena los valores. Genera cada secreto **nuevo y distinto**:

```bash
openssl rand -base64 24   # MYSQL_ROOT_PASSWORD (min 20 car.)
openssl rand -base64 24   # MYSQL_APP_PASSWORD (min 20 car.)
openssl rand -hex 64      # JWT_SECRET (min 32 car.)
openssl rand -base64 24   # SUPER_ROOT_PASSWORD (temporal del seed)
```

- `DOMINIO` — tu dominio real, **sin** `https://` (ej: `preoperacional.com`).
- `RUN_SEED=true` **solo para el primer arranque** (ver §4 y §7).
- `SUPER_ROOT_PASSWORD` es la contraseña **temporal** de `root@system.local`;
  el sistema obligará a cambiarla en el primer login.
- NO reutilices ninguna contraseña de desarrollo.

> ⚠️ El `.env` real NUNCA se sube al repositorio (ignorado por `.gitignore`).
> En el repo solo vive la plantilla `.env.production.example` (sin valores).

---

## 3. Construir y primer arranque

```bash
docker compose up -d --build
docker compose logs -f backend   # espera: "Migrations complete." + "Seed complete." + "Starting server"
```

El entrypoint (`backend/docker-entrypoint.sh`) ejecuta en orden:
1. `prisma migrate deploy` — crea/actualiza el esquema de las 17 tablas.
2. `node dist/seed.js` — **solo si `RUN_SEED=true`**: siembra empresa +
   formulario (12 preguntas) + **único usuario** `root@system.local`
   con `mustChangePassword=true`.
3. Arranca la API con el filtro global de errores y la validación fail-fast
   del entorno (si falta `JWT_SECRET` o credenciales, no arranca).

Verifica el healthcheck:
```bash
curl https://api.dominio.com/api/health   # {"status":"ok","database":"connected"}
```

Si el healthcheck falla, revisa: DNS propagado (§1), firewall abierto (§0.2),
y logs con `docker compose logs backend`.

---

## 4. Primer login (cambio forzado de contraseña)

1. Abre `https://admin.dominio.com` → login SUPER_ROOT →
   `root@system.local` / la contraseña temporal que definiste en `.env`
   (`SUPER_ROOT_PASSWORD`).
2. El sistema **redirige automáticamente** a cambiar contraseña y el backend
   bloquea toda la API (`403 PASSWORD_CHANGE_REQUIRED`) hasta completarla.
   La nueva debe cumplir la política (longitud, banlist, sin datos personales,
   sin secuencias).
3. Al cambiarla: la sesión se libera y las sesiones previas se revocan.

---

## 5. Crear los ADMIN de la empresa

Aún como SUPER_ROOT en el panel:
1. **Usuarios → Nuevo usuario → rol ADMIN**, empresa, cédula, nombre, correo y
   contraseña temporal (cumple la política).
2. Todo usuario creado recibe `mustChangePassword=true`: el admin deberá
   cambiar su contraseña en su primer inicio (misma mecánica que §4).
3. Cada ADMIN configura formularios/conductores de su empresa. Los conductores
   creados por el panel también arrancan con cambio forzado (la app móvil lo
   gestiona en `CambiarClaveView`).

---

## 6. Cerrar el bootstrap

```bash
# en el .env del VPS:
RUN_SEED=false
# y luego:
docker compose up -d
```

El seed es idempotente y seguro (nunca reescribe contraseñas ni re-activa el
cambio forzado), pero déjalo en `false` como estado estable.

---

## 7. Backups automáticos

El script `scripts/backup.sh` hace dump consistente de MySQL + empaqueta las
fotos del volumen `uploads`, con retención de 30 días y copia externa opcional
(`BACKUP_REMOTE` vía rsync — **el backup nunca debe vivir solo en el VPS**):

```bash
chmod +x /opt/preoperacional/scripts/backup.sh
sudo tee /etc/cron.d/preoperacional-backup <<'EOF'
0 3 * * * root /opt/preoperacional/scripts/backup.sh >> /var/log/preoperacional-backup.log 2>&1
EOF
```

### 7.1 Prueba de restauración (OBLIGATORIA antes de firmar)
El backup no sirve si no puedes restaurarlo. Prueba en un contenedor aislado:

```bash
# restaurar la BD:
docker run --rm -i \
  -e MYSQL_ROOT_PASSWORD=tmp -e MYSQL_DATABASE=preoperacional_db \
  mysql:8.0 sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  < <(gunzip -c /var/backups/preoperacional/db-*.sql.gz)
```
Si activaste `BACKUP_REMOTE`, prueba también que `rsync` sincroniza y que
puedes restaurar desde el destino remoto.

---

## 8. APK de conductores (app-conductores)

La app móvil (Capacitor + Android) apunta a la API de producción. Estos pasos
no tocan el servidor; se hacen en tu PC de compilación.

### 8.1 Apuntar la URL de la API
Edita `app-conductores/.env.production` y pon **tu** dominio:

```
VITE_API_URL=https://api.tu-dominio.com
```

### 8.2 Requisitos de compilación (en tu PC)
- Node.js 20+
- JDK 17
- Android SDK (o Android Studio)

### 8.3 Construir
```bash
cd app-conductores
pnpm install
pnpm build
npx cap sync android
```

### 8.4 Firmar (solo 1 vez; guarda los secretos para siempre)
Genera el keystore una única vez y guárdalo en sitio seguro (un `.jks` perdido
implica perder la capacidad de actualizar la app publicada):

```bash
keytool -genkey -v -keystore preoperacional-release.jks \
  -alias preoperacional -keyalg RSA -keysize 2048 -validity 10000
```

Luego configura `android/app/build.gradle` (bloque `signingConfigs` + apuntar
`release` a él) para usar ese keystore con sus credenciales.

### 8.5 Generar el paquete
```bash
cd android
./gradlew bundleRelease    # → AAB (Play Store)
./gradlew assembleRelease  # → APK (instalación directa)
```

### 8.6 Nota de seguridad
`capacitor.config.ts` fuerza `androidScheme: 'https'` → la app solo habla por
HTTPS. No deshabilites `cleartextTraffic` en producción.

### 8.7 Publicación en Play Store
- Sube el AAB firmado a Play Console (Internal/Closed/Production testing).
- Completa la política de privacidad (plantilla en `PRIVACY_POLICY.md`).
- El primer login del conductor usa el mismo mecanismo de cambio forzado.

---

## 9. Escalar fotos a object storage (cuando el disco crezca)

Si el volumen de fotos crece, en lugar de subir de plan migra los uploads:
1. Mueve el volumen `uploads` a un bucket (S3/DO Spaces/Backblaze).
2. Actualiza la lógica de subida/descarga en backend para usar el bucket.
3. Mantén el backup remoto como segunda copia.
*(Tarea de desarrollo posterior; documentada aquí para planificar el ciclo de vida.)*

---

## 10. Comandos útiles

```bash
docker compose logs -f backend     # ver logs de la API
docker compose logs -f db          # ver logs de MySQL
docker compose restart backend     # reiniciar solo la API
docker compose ps                  # estado de los 4 contenedores
docker compose down                # detener todo (sin borrar datos)
docker compose down -v             # detener y BORRAR volúmenes (DB y fotos) — CUIDADO
# actualizar tras cambios en el código:
git pull
docker compose up -d --build
```

---

## 11. Checklist final de producción

- [ ] `https://api.dominio.com/api/health` → `status: ok`
- [ ] Login SUPER_ROOT con cambio forzado completado (contraseña nueva ≠ temporal)
- [ ] `RUN_SEED=false` en el `.env`
- [ ] Al menos 1 ADMIN creado y con su contraseña cambiada en primer login
- [ ] Formulario preoperacional visible con sus 12 preguntas
- [ ] Cron de backups activo y **restauración probada** (§7.1)
- [ ] Certificados SSL activos (Caddy los emite solo; verifica candado en admin/api)
- [ ] `SUPER_ROOT_PASSWORD` y `.env` NUNCA subidos al repo ni compartidos
- [ ] APK de conductores firmada apuntando a `https://api.TU-dominio.com` (§8)
- [ ] Sentry (opcional) reportando errores
