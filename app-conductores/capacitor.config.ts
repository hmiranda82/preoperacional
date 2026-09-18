import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.preoperacional.app',
  appName: 'Revisión',
  webDir: 'dist',
  server: {
    // SEGURIDAD: HTTPS obligatorio en el WebView. Tokens y PII nunca viajan
    // en claro; el origin del APK (https://localhost) está en la whitelist
    // CORS de la API de producción.
    androidScheme: 'https',
  },
    android: {
      backgroundColor: '#F2F3F4',
      allowMixedContent: false,
    },
  ios: {
    scheme: 'Revision',
    backgroundColor: '#1a2540',
    contentInset: 'always',
    preferredContentMode: 'mobile',
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen',
    },
  },
}

export default config
