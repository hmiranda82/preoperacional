# Sistema Preoperacional — Guía de Instalación y Configuración

## Arquitectura del Sistema

```
app-conductores (Vue 3 + Capacitor)  →  backend (NestJS)  →  MariaDB
frontend-admin  (Vue 3 + Vuetify)    →  backend (NestJS)  →  MariaDB
```

---

## 1. Base de Datos

### Paso 1: Crear la base de datos
Ejecuta el archivo `preopreracional_db.sql` en tu gestor MariaDB/MySQL:
```sql
-- En HeidiSQL, DBeaver o línea de comandos:
source preopreracional_db.sql
```

---

## 2. Backend (NestJS)

### Configuración `.env`
Edita `backend/.env` con tus datos reales:
```
DATABASE_URL="mysql://TU_USUARIO:TU_PASSWORD@localhost:3306/preoperacional_db"
JWT_SECRET="cambia_esto_por_una_clave_segura_larga"
PORT=3000
API_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,capacitor://localhost,http://localhost
```

### Instalación y ejecución
```bash
cd backend
npm install
npx prisma generate      # Genera el cliente Prisma desde el schema
npx prisma db push       # Esto crea todas las tablas según schema.prisma
npx ts-node src/seed.ts  # Crea el formulario y admin inicial
npm run start:dev        # Inicia en modo desarrollo con hot-reload
```

### Primer uso: Crear formulario y usuario admin
Una vez el backend esté corriendo, ejecuta el seed:
```bash
npx ts-node src/seed.ts
```
Esto crea el formulario de inspección y un usuario admin inicial.

---

## 3. Frontend Admin (Vue 3)

### Configuración `.env`
```
VITE_API_URL=http://localhost:3000
```

### Instalación y ejecución
```bash
cd frontend
npm install
npm run dev       # Corre en http://localhost:5173
```

---

## 4. App Conductores (Vue 3 + Capacitor)

### Configuración `.env` para desarrollo web
```
VITE_API_URL=http://localhost:3000
```

### Configuración para dispositivo Android físico
Cambia la IP por la de tu computador en la red local:
```
VITE_API_URL=http://192.168.X.X:3000
```
> Tip: usa `ipconfig` (Windows) o `ifconfig` (Linux/Mac) para encontrar tu IP.

### Para emulador Android
```
VITE_API_URL=http://10.0.2.2:3000
```

### Instalación y ejecución web
```bash
cd app-conductores
npm install
npm run dev      # Corre en http://localhost:5174
```

### Build para Android
```bash
npm run build
npx cap sync android
npx cap open android     # Abre Android Studio
```

---

## Bugs Corregidos en Esta Versión

### BUG CRÍTICO #1 — responses.service.ts
**Problema:** El código usaba `userId` y la relación `user` en queries de Prisma,
pero el modelo `Response` en la BD usa `driverId` y la relación `driver`.

**Efecto:** El backend lanzaba un error de Prisma al intentar crear o consultar
inspecciones, haciendo que la app de conductores no pudiera enviar formularios.

**Corrección:** `responses.service.ts` ahora:
- Resuelve `driverId` desde el `userId` del JWT antes de operar
- Usa `driver: { include: { user } }` en RESPONSE_INCLUDE
- Devuelve el objeto `user` serializado para mantener compatibilidad con el frontend

### BUG #2 — frontend/src/types/index.ts
**Problema:** La interfaz `Response` tenía `userId: number` pero el campo real es `driverId`.

**Corrección:** La interfaz ahora usa `driverId: number` y el campo `user` es el
objeto serializado que devuelve el backend.

### BUG #3 — backend/.env
**Problema:** Faltaba la variable `CORS_ORIGINS` para producción/dispositivos móviles.

**Corrección:** Añadida `CORS_ORIGINS` con todos los orígenes necesarios.

---

## Flujo Normal del Sistema

1. **Admin** crea conductores en el frontend-admin (POST /users)
2. **Conductor** hace login en la app (POST /auth/login)
3. **Conductor** verifica si ya inspeccionó hoy (GET /responses/check)
4. **Conductor** llena y envía el formulario (POST /responses)
5. **Admin** ve todas las inspecciones (GET /responses)
6. **Admin** puede exportar a Excel desde el frontend-admin

---

## Puertos por defecto
| Servicio | Puerto |
|----------|--------|
| Backend | 3000 |
| Frontend Admin | 5173 |
| App Conductores | 5174 |
