@echo off
echo ════════════════════════════════════════
echo  Build Release — Preoperacional
echo ════════════════════════════════════════
echo.

:: 1. Build web assets
echo [1/3] Compilando web assets...
cd /d "%~dp0"
call pnpm build
if %errorlevel% neq 0 (
    echo  ERROR: Fallo la compilacion web
    pause
    exit /b 1
)

:: 2. Sync Capacitor
echo [2/3] Sincronizando Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo  ERROR: Fallo sync de Capacitor
    pause
    exit /b 1
)

:: 3. Build release AAB
echo [3/3] Compilando Android App Bundle (AAB)...
cd android
call gradlew bundleRelease
if %errorlevel% neq 0 (
    echo  ERROR: Fallo el build release
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Build exitoso.
echo 📦 AAB generado en:
echo    android\app\build\outputs\bundle\release\app-release.aab
echo.
pause
