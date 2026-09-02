#!/bin/bash
# ==========================================================
# setup-ios.sh  —  Aplicar configuraciones post npx cap sync
# Ejecutar en Mac después de: npm run cap:ios
# ==========================================================
set -euo pipefail

IOS_DIR="ios/App/App"
PLIST="$IOS_DIR/Info.plist"
PROJECT="$IOS_DIR/../App.xcodeproj"

if [ ! -f "$PLIST" ]; then
    echo "❌ No se encuentra $PLIST"
    echo "Ejecuta primero: npm run cap:ios"
    exit 1
fi

echo "✅ Info.plist encontrado"

# ------------------------------------------
# 1. Permisos de cámara y galería
# ------------------------------------------
echo "📷 Agregando permisos de cámara y fotos..."

# NSCameraUsageDescription
/usr/libexec/PlistBuddy -c "Add NSCameraUsageDescription string La app necesita acceso a la cámara para tomar fotos de los vehículos durante las inspecciones." "$PLIST" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Set :NSCameraUsageDescription La app necesita acceso a la cámara para tomar fotos de los vehículos durante las inspecciones." "$PLIST"

# NSPhotoLibraryUsageDescription
/usr/libexec/PlistBuddy -c "Add NSPhotoLibraryUsageDescription string La app necesita acceso a la galería para seleccionar fotos de los vehículos." "$PLIST" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Set :NSPhotoLibraryUsageDescription La app necesita acceso a la galería para seleccionar fotos de los vehículos." "$PLIST"

# NSPhotoLibraryAddUsageDescription
/usr/libexec/PlistBuddy -c "Add NSPhotoLibraryAddUsageDescription string La app necesita guardar fotos de las inspecciones en tu galería." "$PLIST" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Set :NSPhotoLibraryAddUsageDescription La app necesita guardar fotos de las inspecciones en tu galería." "$PLIST"

# ------------------------------------------
# 2. UIStatusBarStyle para tema oscuro
# ------------------------------------------
echo "🎨 Configurando UIStatusBarStyle..."
/usr/libexec/PlistBuddy -c "Add UIViewControllerBasedStatusBarAppearance bool true" "$PLIST" 2>/dev/null || true

# ------------------------------------------
# 3. Color de fondo del launch screen (opcional)
# ------------------------------------------
LAUNCH_STORYBOARD="$IOS_DIR/Base.lproj/Main.storyboard"
if [ -f "$LAUNCH_STORYBOARD" ]; then
    echo "🎨 Fondo del splash configurado en capacitor.config.ts"
fi

# ------------------------------------------
# 4. Configurar equipo de desarrollo en Xcode
# ------------------------------------------
echo ""
echo "⚠️  Antes de compilar, abre el proyecto en Xcode:"
echo "   open ios/App/App.xcworkspace"
echo ""
echo "   Luego:"
echo "   1. En el navegador, selecciona 'App' (el target principal)"
echo "   2. Ve a 'Signing & Capabilities'"
echo "   3. Selecciona tu 'Team' (Apple Developer)"
echo "   4. Verifica que el Bundle Identifier sea: com.preoperacional.app"
echo ""
echo "   Para subir a App Store:"
echo "   - Product → Archive"
echo "   - Distribuye con 'App Store Connect'"
echo ""

echo "✅ Configuración iOS aplicada correctamente"
