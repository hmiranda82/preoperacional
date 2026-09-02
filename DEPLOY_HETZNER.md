# Deploy en Hetzner VPS — Preoperacional

## 1. Contratar VPS en Hetzner

1. Ve a https://hetzner.com y crea una cuenta
2. Ve a **Cloud** → **Projects** → **New Project**
3. Crea un servidor (**Add Server**):
   - **CX22** (~€4.49/mes): 2 vCPU, 4GB RAM, 40GB SSD
   - SO: **Ubuntu 24.04**
   - Sin volúmenes extras
   - Elige una región cercana (Nürnberg o Helsinki)
   - Añade tu **llave SSH** (o la contraseña que te generen)
4. Anota la **IP pública** del servidor

## 2. Configurar dominio (opcional para HTTPS)

Si tienes un dominio, crea dos registros A apuntando a la IP del servidor:

```
admin.tudominio.com  →  IP_DEL_VPS
api.tudominio.com    →  IP_DEL_VPS
```

Para pruebas sin dominio, puedes saltar este paso (usarás HTTP).

## 3. Conectar al servidor

```bash
ssh root@IP_DEL_VPS
```

## 4. Instalar Docker y Git

```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2 git
```

## 5. Clonar el proyecto

```bash
git clone https://github.com/TU_USUARIO/preoperacional.git
cd preoperacional
```

> Si no usas git, sube los archivos con `scp`:
> ```bash
> scp -r C:\Users\TU_USUARIO\VERSION-12 root@IP_DEL_VPS:/root/preoperacional
> ```

## 6. Configurar variables de entorno

```bash
cp .env.hetzner .env
nano .env
```

Edita los valores:
- `MYSQL_ROOT_PASSWORD` — cámbiala por una segura
- `DOMINIO` — pon tu dominio (ej: `tudominio.com`). Si no tienes, déjalo vacío y usaremos HTTP
- `JWT_SECRET` — cámbialo por un secreto seguro

## 7. Construir y lanzar

```bash
docker compose up -d --build
```

Esto inicia:
- MySQL (puerto interno 3306)
- Backend API (puerto interno 3002)
- Admin Frontend (puerto interno 80)
- Caddy (puertos 80 y 443)

## 8. Verificar que funciona

```bash
docker compose ps
docker compose logs -f
```

Espera 1-2 minutos a que migre la base de datos. Luego:

- **Admin panel**: `https://admin.TUDOMINIO.com` (o `http://IP_DEL_VPS:8080`)
- **API**: `https://api.TUDOMINIO.com` (o `http://IP_DEL_VPS:3002`)

> **Sin dominio**: solo HTTP, edita `docker-compose.yml` para exponer `backend:3002` y `frontend:80` directamente.

## 9. Configurar app-conductores

1. Abre `app-conductores/.env.production` y cambia la URL por tu API:
   ```
   VITE_API_URL=https://api.TUDOMINIO.com
   ```
2. Para pruebas **sin dominio** (HTTP), también debes volver a habilitar tráfico HTTP en el Android:
   - Edita `android/app/src/main/res/xml/network_security_config.xml`
   - Cambia `cleartextTrafficPermitted="false"` a `"true"`
3. Reconstruye el AAB:
   ```
   cd app-conductores
   pnpm build
   npx cap sync android
   cd android
   ./gradlew bundleRelease
   ```

## 10. Comandos útiles

```bash
# Ver logs
docker compose logs -f backend
docker compose logs -f db

# Reiniciar servicios
docker compose restart backend

# Detener todo
docker compose down

# Actualizar (tras cambios en código)
git pull
docker compose up -d --build

# Hacer backup de la BD
docker compose exec db mysqldump -u root -p preoperacional_db > backup.sql
```

## 11. Escalar para 2000 conductores

El CX22 (4GB RAM) soporta 2000 conductores sin problema. Si se vuelve lento:

- **CX32** (4 vCPU, 8GB) — ~€8/mes
- **CX42** (8 vCPU, 16GB) — ~€16/mes

Solo cambias el plan en Hetzner y ejecutas `docker compose up -d` de nuevo.

---

**Nota**: Cuando tengas el dominio y estés listo para Play Store, asegúrate de tener HTTPS funcionando y la política de privacidad lista.
