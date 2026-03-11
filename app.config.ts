import 'dotenv/config';
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'greencheck-mobile',
  slug: 'greencheck-mobile',
  scheme: 'greencheck',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: 'com.yairabc.greencheckmobile',
  },
  android: {
    package: 'com.yairabc.greencheckmobile',
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
