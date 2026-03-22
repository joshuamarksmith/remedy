import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.remedy.sleeptracker',
  appName: 'Remedy',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
    preferredContentMode: 'mobile',
  },
  server: {
    // Use local assets, not a remote URL
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
};

export default config;
