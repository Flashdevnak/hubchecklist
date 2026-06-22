import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flashops.hubchecklist',
  appName: 'Hub Vehicle Proof Capture',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
