import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.preoperacional.app',
  appName: 'Revisión',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
    android: {
      allowMixedContent: true,
      backgroundColor: '#F2F3F4',
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
