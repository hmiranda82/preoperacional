# Purga de historial Git y Rotación de Secretos — Preoperacional

> **Alcance del incidente (verificado 2026-09):** en el repositorio público
> `https://github.com/hmiranda82/Preoperacional` (rama `master`) fueron subidos
> (commit `014cdb7`):
>
> 1. `Base de Datos/preoperacional_db.sql` — dump completo de la BD con datos
>    personales de conductores.
> 2. `login.json` — JWT de acceso + refresh token reales de `root@system.local`
>    (**SUPER_ROOT**).
> 3. (Ya corregido) zips/`.7z` con `.env` reales — fueron borrados del disco y
>    ya no se versionan (ver `.gitignore`), pero asume sus secretos expuestos.
>
> Los refresh tokens viven en la tabla `sessions` de la BD.

## LEE PRIMERO (importante)

- **La purga NO "des-publica"**: cualquiera que haya clonado o un caché de
  GitHub puede conservar copias. El objetivo de la Parte A es **dejar de
  exponer**; la seguridad real la da la **Parte B (rotación)**. Haz AMBAS.
- Todo lo que estaba publicado debe tratarse como **comprometido para siempre**:
  `JWT_SECRET`, passwords MySQL, y las contraseñas de `admin@preoperacional.com`
  y `root@system.local`.
- **Haz un backup local ANTES de empezar** (carpeta fuera del repo y sin subir
  a ningún sitio): copia `backend/uploads`, la carpeta `PROYECTO REVISION`
  completa o al menos el `.git` (o `git clone --mirror`).

---

# PARTE A — Eliminar los archivos sensibles del historial de git

Se recomienda la **Opción 1** (repo nuevo privado): es la más simple y elimina
cualquier rastro sin herramientas extra. La **Opción 2** (rewrite en el mismo
repo con `git-filter-repo`) conserva la URL/historial.

## Opción 1 — Repo nuevo + privado (recomendada)

```powershell
# 0) Respaldar el repo actual (para no perder historia si la necesitas)
#    En PowerShell, desde Desktop:
Copy-Item "C:\Users\HUGO MIRANDA\Desktop\.git" "C:\temp\preop_git_bak" -Recurse
#      (o:  git clone --mirror C:\Users\HUGO MIRANDA\Desktop C:\temp\preop_mirror.git)

# 1) Mover el .git actual a un lado (el código y el .gitignore ya están limpios)
Rename-Item "C:\Users\HUGO MIRANDA\Desktop\.git" ".git-antiguo"

# 2) Crear repo limpio desde el árbol actual
cd C:\Users\HUGO MIRANDA\Desktop
git init
git add .
git status                            # verifica: NO debe aparecer preoperacional_db.sql, login.json, *.env, *.7z
git commit -m "Inicial: proyecto sanitizado (sin secretos)"
```

```powershell
# 3) Crear en GitHub un repo NUEVO y PRIVADO (p. ej. name "Preoperacional",
#    visibility: PRIVATE) y conectarlo:
git remote add origin https://github.com/TU_USUARIO/NUEVO_REPO.git
git push -u origin master
```

```powershell
# 4) En GitHub:
#    - Marcar el repo VIEJO (hmiranda82/Preoperacional) como PRIVATE o
#      borrarlo: Settings → Danger Zone → Delete this repository.
#    - En Settings → Security settings, revisar Secret scanning alerts.
#    - Revocar cualquier Personal Access Token / ID de GitHub de la máquina
#      (Settings → Developer settings → Personal access tokens).
```

## Opción 2 — Reescribir el historial del mismo repo (filter-repo)

```powershell
# 0) Instalar git-filter-repo (Windows):
#    - Descarga "git-filter-repo" (archivo único) desde el repo de github
#      git-filter-repo (https://github.com/newren/git-filter-repo/releases)
#      y ponlo en PATH,  O BIEN:  pip install git-filter-repo

# 1) Respaldar TODO el .git (imprescindible)
Copy-Item "C:\Users\HUGO MIRANDA\Desktop\.git" "C:\temp\preop_git_bak" -Recurse

# 2) Desde la raíz del repo (Desktop), eliminar los archivos sensibles de TODO el historial
cd C:\Users\HUGO MIRANDA\Desktop
git filter-repo --invert-paths `
  --path-glob "**/preoperacional_db.sql" `
  --path-glob "**/login.json" `
  --path-glob "**/VERSION-12.7z"

# 3) fil-t-filter-repo borra el remote. Volver a añadirlo y forzar el push
git remote add origin https://github.com/hmiranda82/Preoperacional.git
git push --force --all
git push --force --tags
```

```powershell
# 4) Verificación de que ya no existen en el historial:
git log --all --oneline
git log --all --name-only | Select-String "preoperacional_db|login.json|VERSION-12.7z"   # → vacío
# En GitHub: probar el raw directo y confirmar 404, p. ej.
#   https://raw.githubusercontent.com/hmiranda82/Preoperacional/master/PROYECTO%20REVISION/VERSION-12/login.json
```

> ⚠️ `filter-repo` reescribe los SHAs: cualquier otro clon local/remoto debe
> re-clonar. Si usas la Opción 2, haz también que la rama sea protegida en
> GitHub (Settings → Branches → Require pull request reviews) por si alguien
> reintroduce archivos `.sql`/`.env`.

---

# PARTE B — Rotación de secretos (imprescindible hagas o no la Parte A)

## B.1 — JWT_SECRET

```powershell
# Generar un secreto nuevo (64 bytes hex)
$b = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Fill($b)
[Convert]::ToHexString($b).ToLower()
```

Actualizar **en estos 3 lugares** (mismo valor):

| Archivo | Campo |
|---|---|
| `backend/.env` (local) | `JWT_SECRET="..."` |
| `.env.hetzner` (plantilla de despliegue, raíz de VERSION-12) | `JWT_SECRET=...` |
| VPS Hetzner → `nano .env` (el archivo real copiado a `/root/preoperacional/.env`) | `JWT_SECRET=...` |

Después, reiniciar el backend:

```bash
# local (Windows): detener el proceso node de dist/main.js y volver a lanzarlo
# VPS (docker):  cd /root/preoperacional && docker compose up -d --build backend
```

> Efecto: todos los access tokens actuales dejan de ser válidos → todos deben
> volver a iniciar sesión (sujeto a B.3 que invalida también los refresh tokens).

## B.2 — Contraseñas de base de datos

**Local (MariaDB en Windows):**

```powershell
# Conectarse y cambiar la contraseña de root
& "C:\Program Files\MariaDB 12.1\bin\mysql.exe" -u root -p
-- dentro del cliente:
ALTER USER 'root'@'localhost' IDENTIFIED BY 'NUEVA_PASS_DB_FUERTE';
FLUSH PRIVILEGES;
EXIT;
```

Actualizar `backend/.env` → `DATABASE_URL="mysql://root:NUEVA_PASS_DB_FUERTE@localhost:3306/preoperacional_db"`
y reiniciar el backend.

**Producción (MySQL 8 en Docker, VPS):**

```bash
cd /root/preoperacional
docker compose exec db mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" -e "
  ALTER USER 'root'@'%' IDENTIFIED BY 'NUEVO_ROOT';
  ALTER USER 'preop_user'@'%' IDENTIFIED BY 'NUEVO_APP';
  FLUSH PRIVILEGES;"
```

Luego:
- Editar `.env` en el VPS (`nano .env`) y `.env.hetzner` en local: **`MYSQL_ROOT_PASSWORD`** y **`MYSQL_APP_PASSWORD`** con las mismas pass.
- Recrear el backend para que use la nueva `DATABASE_URL`:
  `docker compose up -d`

> ⚠️ Con MySQL en un volumen existente, cambiar `.env` **no** cambia la contraseña
> real del servidor; por eso es obligatorio el `ALTER USER` de arriba.

## B.3 — Passwords de `admin@preoperacional.com` y `root@system.local` + invalidar refresh tokens

**Paso 1 — generar los hashes bcrypt** (desde la carpeta `backend`):

```powershell
cd C:\Users\HUGO MIRANDA\Desktop\PROYECTO REVISION\VERSION-12\backend
cmd /c "node -e "require('bcrypt').hash('NUEVA_PASS_ADMIN', 12).then(function(h){console.log('ADMIN='+h)})""
cmd /c "node -e "require('bcrypt').hash('NUEVA_PASS_SUPERROOT', 12).then(function(h){console.log('SUPER='+h)})""
```

**Paso 2 — crear el script SQL** `rotacion.sql` (sustituye `<HASH_ADMIN>` y `<HASH_SUPER>`
por la salida real; los `$` del hash son literales, por eso se usa un archivo y no
una línea `-e`):

```sql
-- rotacion.sql
UPDATE users SET password = '<HASH_ADMIN>', updated_at = NOW() WHERE email = 'admin@preoperacional.com';
UPDATE users SET password = '<HASH_SUPER>', updated_at = NOW() WHERE email = 'root@system.local';
-- Invalida TODOS los refresh tokens publicados (incluido el de login.json)
DELETE FROM sessions;
```

**Paso 3 — aplicar:**

```powershell
# Local:
Get-Content rotacion.sql | & "C:\Program Files\MariaDB 12.1\bin\mysql.exe" -u root -p preoperacional_db

# Producción (desde el VPS):
docker compose exec -T db mysql -u root -p preoperacional_db < rotacion.sql
```

> `DELETE FROM sessions` revoca todas las sesiones activas; todos (admin, super
> root y conductores) vuelven a iniciar sesión con las nuevas credenciales.

## B.4 — GitHub y accesos

- Revoca/borra cualquier **Personal Access Token** de la máquina
  (GitHub → Settings → Developer settings → Personal access tokens).
- Si usas `gh`, comprueba: `gh auth status` y re-loguea si es necesario.
- Activa **2FA** en la cuenta de GitHub si no lo está.
- Protege la rama `master` (Settings → Branches) en el repo (nuevo o purgado).

## B.5 — Cosas pequeñas que pasarse desapercibidas

- La contraseña vieja del admin (por defecto `admin123`) estuvo **en código
  público**: no la reutilices en ningún otro servicio.
- Borra el historial de tu PowerShell si escribiste secretos a mano:
  `Clear-History` (en la práctica lo importante es la rotación de B.1–B.3).
- Verify `backend/uploads` no cuelga de la raíz del repo: ya está en
  `.gitignore`? NO está versionado (bien).

---

# PARTE C — Verificación final

```powershell
# 1) El árbol actual y el historial ya no contienen archivos sensibles
git log --all --name-only | Select-String "preoperacional_db|login.json|\.env$|\.sql$|\.7z$|\.zip$"   # → solo migration/.env.example

# 2) Dependencias sin vulnerabilidades conocidas
#    backend / frontend / app-conductores:
cmd /c "pnpm audit"

# 3) El servidor usa los nuevos secretos y la app responde
#    (health: debe dar 200 y "database":"connected")
```

```powershell
# 4) Prueba de login real con las nuevas credenciales
#    admin@preoperacional.com / NUEVA_PASS_ADMIN        → 200 (es ADMIN)
#    root@system.local     / NUEVA_PASS_SUPERROOT       → 200 (es SUPER_ROOT)
```

## Checklist

- [ ] Backup local del `.git` / proyecto creado (y sin subir)
- [ ] **Parte A**: historia purgada o repo nuevo privado + `git push --force`
- [ ] `B.1` JWT_SECRET nuevo en `backend/.env`, `.env.hetzner` y VPS
- [ ] `B.2` Passwords MySQL nuevas + `ALTER USER` aplicado (local y VPS)
- [ ] `B.3` Passwords admin/superroot nuevas (bcrypt) + `DELETE FROM sessions`
- [ ] `B.4` PAT revocado, 2FA activo, rama protegida
- [ ] `C` `pnpm audit` limpio y login manual 200
- [ ] `DEPLOY_HETZNER.md` actualizado si cambiaste la URL del repo (`git pull` nuevo origen)

---

**Nota técnica:** esta guía cubre exactamente el incidente verificado. Si en el
futuro vuelves a subir algo, el `.gitignore` endurecido de VERSION-12 y la rama
protegida de GitHub son la red de seguridad.