# Changelog

Todos los cambios notables en el proyecto Preoperacional se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] — 2026-09-02

### Seguridad — Ciclo completo de contraseñas (ADMIN y CONDUCTOR)

Implementación según NIST SP 800-63B y OWASP ASVS v4:

- **Política unificada de contraseñas** (`common/password-policy.ts`): 8–72 caracteres (límite real de bcrypt), lista de contraseñas comunes, secuencias de teclado/numéricas (≥4, normal y reversa), caracteres repetidos y datos personales (correo/cédula). Aplicada en crear, editar, cambiar y restablecer.
- **Auto-cambio de contraseña** `POST /auth/change-password` (autenticado): exige la contraseña actual, rechaza reutilizarla, revoca todas las demás sesiones y re-emite refresh token. Disponible en panel (menú de perfil → "Cambiar contraseña" / ruta `/password`) y en la app de conductores (Perfil → "Cambiar contraseña" / `/cambiar-clave`).
- **Restablecimiento por token de un solo uso**: nuevo modelo `PasswordReset` (solo se guarda el **SHA-256** del token, nunca el token plano), TTL 30 min, un solo uso, cuenta activa, nunca para SUPER_ROOT. Endpoints: `POST /auth/generate-reset` (ADMIN/SUPER_ROOT) y `POST /auth/reset-password` (público). UI: botón 🔑 en Usuarios → modal que muestra el token una sola vez con copiar al portapapeles; pantallas públicas `/reset-password` (panel) y `/restablecer` (app).
- **Cambio obligatorio en primer inicio**: cuando un admin reasigna una contraseña (`PUT /users/:id`) o genera un token, se marca `must_change_password`; el login responde `mustChangePassword: true` y panel/app fuerzan la pantalla de cambio.
- **Revocación de sesiones**: `password_changed_at` en `users`; el refresh rechaza sesiones emitidas antes de un cambio de contraseña; cambio/reset/admin-reasignación eliminan las sesiones previas.
- **Refresh tokens hasheados**: `sessions.refresh_token` ahora almacena SHA-256 (un leak de BD ya no permite secuestrar sesiones).
- **Anti-enumeración por timing en login**: cuando el correo no existe se ejecuta bcrypt contra un hash dummy (costo 12) para uniformar la latencia.
- **Corregido**: incoherencia de política (crear exigía 6, login 8 → una contraseña de 6-7 chars no podía iniciar sesión). Ahora: crear/cambiar/restablecer exigen 8–72; el login acepta 6+ por compatibilidad con contraseñas legacy existentes en BD.
- **Auditoría**: nuevas acciones `PASSWORD_CHANGED`, `PASSWORD_CHANGE_FAILED`, `PASSWORD_RESET`, `PASSWORD_RESET_USED`, `PASSWORD_RESET_TOKEN_GENERATED`.
- **Rate limiting**: login 5/60s, reset-password 5/60s, change-password 5/60s, generate-reset 10/60s.

### Verificación

- Unit tests de la política (10/10), e2e backend (10/10), suite integral (50/50), flujo funcional completo por API (32/32) y flujo completo por UI real (CDP 14/14: cambio propio de admin, generación de token desde Usuarios, restablecimiento público, login con la nueva contraseña).

## [1.1.2] — 2026-09-02

### Corregido

- Frontend: la vista **Usuarios** no renderizaba el listado ni permitía crear usuarios (conductor o administrativo). Causa: `ReferenceError: Cannot access 'filtered' before initialization` — el `watch(totalPages, ...)` evaluaba `totalPages` → `filtered` antes de su declaración en `<script setup>` (TDZ), tumbando todo el componente. Se reordenó el bloque de paginación (`totalPages`, `pageItems`, `watch`) para declararse después de `filtered`.
- Verificado end-to-end en navegador real (CDP): login, listado con 8 conductores visible, creación de **CONDUCTOR** y **ADMIN** completadas por la UI sin errores de consola.

## [1.1.1] — 2026-09-02

### Base de datos (limpieza de esquema)

- Revisión integral del esquema («15 tablas / 15 modelos») vs uso real en `backend`, `frontend` y `app-conductores`.
- Eliminadas columnas funcionalmente muertas:
  - `companies.subdomain`: nunca se lee para resolución de tenant (instalación single-tenant); campo solo se mostraba/editable en el panel de Empresas.
  - `responses.latitud` / `responses.longitud`: el app-conductores nunca las envía y **0 de 106 respuestas** tenían valor; el backend solo las serializaba como `null`.
- Limpieza en cascada de referencias: `create-response.dto`, `responses.service`, `update-company.dto`, `types/index.ts` (frontend) y `CompaniesView.vue` (placeholder, input, tipo y payload).
- BD real aplicada con `prisma db push` (workflow del proyecto; no existe `_prisma_migrations`) + `prisma generate`.
- Eliminadas 3 cuentas de prueba residuales `verif_*@preop.test` dejadas por corridas de `verify_full.ps1` (cascada completa). Línea base restaurada: users=12, responses=106, answers=1127.
- Respaldo previo al cambio: `Base de Datos/preoperacional_db_preclean_2026-09-02.sql`.
- Verificado: backend y frontend build OK, E2E 10/10, suite integral **50/50 PASS**, `uploads`=26, `/api/health` OK.

## [1.1.0] — 2026-09-02

### Seguridad

- Auditoría de dependencias (`pnpm audit`): de **38 vulnerabilidades** (1 critical, 20 high, 16 moderate, 1 low) a **0 vulnerabilidades**.
- `tar` (critical, DoS de descompresión) eliminado de producción moviendo `@capacitor/cli` a `devDependencies` en `app-conductores`.
- `xlsx@0.18.5` (deprecado, sin fix en npm; prototype pollution + ReDoS) reemplazado por el build oficial parcheado `0.20.3` desde el CDN de SheetJS.
- `axios` subido a `^1.18.0` en `frontend` y `app-conductores` (proxy inheritance + ReDoS + prototype pollution).
- `exceljs` eliminado del backend (dependencia sin uso; arrastraba `uuid`/`tmp`/`brace-expansion` vulnerables). El frontend lo mantiene (exportación ejecutiva).
- Overrides globales en `pnpm-workspace.yaml` (`body-parser`, `multer`, `dompurify`, `postcss`, `nanoid`, `tmp`, `uuid`, `brace-expansion×4`) para parchear dependencias transitivas.

### Corregido

- Backend: suite E2E (`test/app.e2e-spec.ts`) no ejecutable con `bcrypt@6` + `jest@30` (`Cannot redefine property: compare`); se mockea el módulo `bcrypt` desde la fábrica y se completan los mocks faltantes (`ausencia`, `vacationDay`). De 0 → **10/10 PASS**.
- Backend: test E2E de uploads dejaba archivos huérfanos en `backend/uploads`; ahora se auto-limpia.
- Suite integral de verificación (50 casos) confirmada **50/50 PASS** sobre el build final sin dejar residuos en `uploads`.

### Cambiado

- `app-conductores`: `@capacitor/cli` movido a `devDependencies`.
- `backend/uploads`: restaurado a 26 archivos (línea base sin artefactos de pruebas).

## [1.0.0] — 2024-07-06

### Añadido

- CI/CD: GitHub Actions workflow con lint, test y build automáticos
- CI/CD: Scripts de deploy con healthchecks y rollback automático
- Seguridad: Helmet CSP, CORS restringido, rate limiting por IP
- Seguridad: Backup automático de base de datos con rotación de 30 días
- Seguridad: Script de setup de VPS con firewall (UFW) y SSH hardening
- Monitorización: Pino logger estructurado con Sentry para errores
- Documentación: Política de seguridad (SECURITY.md)
- Documentación: Guía de deploy para Hetzner (DEPLOY_HETZNER.md)

### Cambiado

- Backend: Migración a NestJS 11 con Prisma ORM
- Backend: Validación de DTOs con class-validator + class-transformer
- Backend: Endpoints protegidos con JWT y guards por rol
- Frontend: Migración a Vue 3 + Vuetify 4 + Pinia
- Frontend: Rutas protegidas con guards de navegación
- Frontend: Interceptor HTTP para refresco automático de tokens
- Docker: Imágenes multi-stage con usuarios no-root
- Docker: Healthchecks para todos los contenedores

### Corregido

- Auditoría — Sesión: Cierre de sesión invalida correctamente el token del lado del servidor
- Auditoría — Sesión: Refresh token rotado en cada uso para prevenir reuso
- Auditoría — Sesión: Tokens marcados como usados tras refresco exitoso
- Auditoría — XSS: Headers CSP configurados globalmente vía Helmet
- Auditoría — Input: Validación estricta en todos los endpoints con mensajes de error genéricos
- Auditoría — CORS: Orígenes permitidos restringidos a `CORS_ORIGINS` desde entorno
- Auditoría — Rate Limit: ThrottlerModule configurado con límite global por IP
- Auditoría — File Upload: Límite de tamaño y validación de tipo MIME en subida de archivos
- Auditoría — Base de Datos: Timeouts y pool size configurados en datasource de Prisma

## [0.1.0] — 2024-05-15

### Añadido

- Versión inicial del proyecto con funcionalidad base
- Backend NestJS básico con autenticación JWT
- Frontend Vue 3 con panel administrador
- App conductores con Capacitor (Android)
- Docker Compose para desarrollo y producción
- Integración con MySQL 8.0
- Módulo de checklist diario para conductores
- Módulo de administración de usuarios y vehículos
- Reportes en Excel con exceljs
- Sincronización offline para app conductores

[1.0.0]: https://github.com/tu-usuario/preoperacional/releases/tag/v1.0.0
[0.1.0]: https://github.com/tu-usuario/preoperacional/releases/tag/v0.1.0
