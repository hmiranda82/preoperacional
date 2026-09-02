# Changelog

Todos los cambios notables en el proyecto Preoperacional se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
