import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.keksakademi.app',
  appName: 'KEKS Akademi',
  webDir: 'out',
  server: {
    url: 'https://keksakademi.vercel.app',
    cleartext: false,
    allowNavigation: ['keksakademi.vercel.app', '*.vercel.app'],
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
