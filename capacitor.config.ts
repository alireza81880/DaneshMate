import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daneshmate.app',
  appName: 'DaneshMate',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#090D16',
    allowMixedContent: true,
  },
};

export default config;
