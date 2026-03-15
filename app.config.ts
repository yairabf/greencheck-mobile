import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'greencheck-mobile',
  slug: 'greencheck-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  scheme: 'greencheck',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yairabc.greencheckmobile',
  },
  android: {
    package: 'com.yairabc.greencheckmobile',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    versionCode: 2,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    enableClientPush: process.env.EXPO_PUBLIC_ENABLE_CLIENT_PUSH,
    authTestMode: process.env.EXPO_PUBLIC_AUTH_TEST_MODE,
    eas: {
      projectId: '70701b87-2e3e-4bde-b443-b6c100b7a5d8',
    },
  },
};

export default config;
