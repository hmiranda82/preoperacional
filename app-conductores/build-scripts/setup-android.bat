@echo off
chcp 65001 >nul
echo ════════════════════════════════════
echo  Configuración Android para Release
echo ════════════════════════════════════
echo.
echo  Las configuraciones nativas ya están aplicadas
echo  en los archivos versionados de android/.
echo.
echo  Si ejecutaste 'npx cap sync android' y necesitas
echo  restaurar cambios, ejecuta:
echo.
echo    git checkout -- android/
echo.
echo  Para compilar release firmado:
echo    cd android ^&^& gradlew bundleRelease
echo.
echo  El AAB se genera en:
echo    android\app\build\outputs\bundle\release\app-release.aab
echo.
echo ⚠️  CAMBIA LAS CONTRASEÑAS del keystore antes de
echo    publicar en Play Store (release.keystore)
echo.
pause
