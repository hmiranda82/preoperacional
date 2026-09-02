# Política de Seguridad — Preoperacional

## Reportar una Vulnerabilidad

Si descubres una vulnerabilidad de seguridad en Preoperacional, por favor repórtala enviando un correo a **seguridad@preoperacional.com** (o al contacto designado por la organización).

Esperamos que:

- No la hagas pública hasta que hayamos tenido oportunidad de responder.
- Incluyas una descripción clara del problema y, si es posible, pasos para reproducirlo.
- Nos des 48 horas hábiles para responder antes de tomar cualquier otra acción.

## Prácticas de Seguridad Implementadas

| Práctica | Implementación |
|---|---|
| **Autenticación** | JWT con expiración, passport-jwt, bcrypt para hash de contraseñas |
| **Helmet** | Middleware de seguridad HTTP activo en `main.ts` (cabeceras CSP, X-Frame-Options, nosniff, etc.) |
| **Rate Limiting** | `@nestjs/throttler` registrado globalmente (30 req/60s por IP) + límites específicos en `/auth/login` y `/auth/super-login` (5 req/60s) |
| **Validación** | `ValidationPipe` global con `whitelist` + `forbidNonWhitelisted` en `main.ts` — los DTOs de `class-validator` se aplican de verdad |
| **Autorización** | Guards `JwtAuthGuard` + `RolesGuard`; solo `SUPER_ROOT` puede crear/asignar rol `SUPER_ROOT`; los ADMIN no pueden tocar cuentas `SUPER_ROOT` ni modificar usuarios de otra empresa |
| **CORS** | Restringido a orígenes específicos vía `CORS_ORIGINS` |
| **Subida/Servido de imágenes** | `POST /uploads/image` y `GET /api/uploads/:file` protegidos por JWT (validación de tipo + magic bytes + tamaño máximo 10MB). No se sirven estáticos públicos |
| **SQL Injection** | Prisma ORM — queries parametrizadas |
| **Secretos** | Variables de entorno con `.env*`; `.gitignore` endurecido: nunca versionar `.env.*`, `keystore.properties`, SQL dumps, `.7z`/`.zip` |
| **Contenedores** | Usuarios no-root en imágenes Docker (appuser); seed deshabilitado en producción (`RUN_SEED=false`) para no pisar credenciales reales |
| **Logs** | Logs estructurados, sin datos sensibles |
| **Backups** | Rotación automática cada 30 días, opcional S3 |
| **Firewall** | UFW en VPS solo con puertos 22, 80, 443 |
| **SSH** | Solo autenticación por llave, root login deshabilitado |

## Incidente de secretos publicado (2026)

El repositorio git (GitHub) llegó a contener un dump de la base de datos
(`Base de Datos/preoperacional_db.sql`), un `login.json` con tokens JWT reales y
archivos `.7z`/`.zip` con `.env`. Esos archivos ya no se versionan (ver `.gitignore`),
los zips se eliminaron del disco y se implementaron las protecciones de esta tabla.

**Pendiente (acción del mantenedor):** el historial git aún conserva esos archivos
en commits antiguos. Hasta que se purgue el historial con `git filter-repo`/BFG,
así como rotar el `JWT_SECRET`, las contraseñas de la BD, las de
`admin@preoperacional.com` y `root@system.local`, considerar esos secretos comprometidos.

## Dependencias

Las dependencias se actualizan periódicamente. Usamos `pnpm audit` para identificar vulnerabilidades conocidas.

## Contacto

Para asuntos de seguridad: **seguridad@preoperacional.com**

Para otros temas: usa las issues del repositorio o el canal de soporte del proyecto.