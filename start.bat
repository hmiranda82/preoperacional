@echo off
setlocal enabledelayedexpansion

:: Asegurar que pnpm está en PATH
set "PNPM_PATH=%APPDATA%\npm"
if exist "%PNPM_PATH%\pnpm.cmd" (
    set "PATH=%PATH%;%PNPM_PATH%"
    echo [OK] pnpm encontrado
) else (
    echo [ERROR] pnpm no encontrado en %PNPM_PATH%
    pause
    exit /b 1
)

echo ========================================
echo  INSPECCION PREOPERACIONAL - INICIAR
echo ========================================
echo.

:: 1. Iniciar MariaDB si no esta corriendo
tasklist /FI "IMAGENAME eq mariadbd.exe" 2>nul | find /I "mariadbd" >nul
if %errorlevel%==0 (
    echo [OK] MariaDB ya esta corriendo
) else (
    echo [..] Iniciando MariaDB...
    start /B "" "C:\Program Files\MariaDB 12.1\bin\mariadbd.exe" --datadir="C:\Program Files\MariaDB 12.1\data" --port=3306
    timeout /t 5 /nobreak >nul
)

:: 2. Ir a la raiz del proyecto
cd /d "%~dp0"

:: 3. Compilar frontend si no existe
if not exist "frontend\dist\index.html" (
    echo [..] Compilando frontend...
    cd frontend
    call pnpm run build
    cd ..
)

:: 4. Iniciar Backend con PM2
if not exist "backend\dist\main.js" (
    echo [..] Compilando backend...
    cd backend
    call pnpm run build
    cd ..
)
echo [..] Iniciando backend con PM2...
node node_modules\pm2\bin\pm2 start backend\dist\main.js --name backend --cwd "%~dp0backend" 2>nul
echo [OK] Backend en http://localhost:3458

:: 5. Servir frontend compilado con un mini servidor estático (serve via backend or http-server)
echo [..] Sirviendo frontend compilado...
start "Frontend" cmd /c "cd /d "%~dp0frontend" && npx serve dist -l 5173 --cors --single"

:: 6. Abrir navegador
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo  Panel:  http://localhost:5173
echo  API:    http://localhost:3458
echo ========================================
echo.
echo  Para DETENER todo, cierra las ventanas
echo  o ejecuta: node node_modules\pm2\bin\pm2 stop backend
echo ========================================
pause
