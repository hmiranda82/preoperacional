# iOS Setup Guide — Preoperacional App

## Prerrequisitos (en Mac)
- Xcode 16+ (desde App Store)
- CocoaPods: `sudo gem install cocoapods`
- Node.js 20+ y pnpm

## Pasos

### 1. Clonar y preparar
```bash
git clone <repo-url>
cd app-conductores
pnpm install
```

### 2. Agregar iOS y aplicar configuraciones
```bash
# Construye web, agrega iOS, abre Xcode
pnpm cap:ios

# Aplicar permisos y configuraciones nativas
chmod +x build-scripts/setup-ios.sh
./build-scripts/setup-ios.sh
```

### 3. En Xcode
1. Seleccionar target **App**
2. **Signing & Capabilities** → seleccionar tu **Team** (Apple Developer)
3. Bundle Identifier: `com.preoperacional.app`
4. Asegurar que el esquema sea **Preoperacional** (configurado en capacitor.config.ts)

### 4. Probar en simulador
- Seleccionar un iPhone (iOS 17+)
- **Product → Run** (⌘R)

### 5. Subir a App Store Connect
- **Product → Archive**
- En Organizer, seleccionar el archive
- **Distribute App → App Store Connect**
- Completar el formulario en App Store Connect

## Notas
- La URL del servidor es configurable desde la app (primer inicio o Perfil)
- El esquema HTTPS es obligatorio en producción
- Para desarrollo local, editar `ios/App/App/Info.plist` y agregar:
  ```xml
  <key>NSAppTransportSecurity</key>
  <dict>
      <key>NSAllowsArbitraryLoads</key>
      <true/>
  </dict>
  ```
  (Solo para desarrollo, no enviar a producción)
