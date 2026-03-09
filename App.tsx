import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { getMissingEnvKeys } from './src/config/validateEnv';
import { getFirebaseServices } from './src/services/firebase';

export default function App() {
  useEffect(() => {
    const missing = getMissingEnvKeys();
    if (missing.length > 0) {
      if (__DEV__) {
        console.warn(
          `Firebase not configured. Missing env vars: ${missing.join(', ')}. See .env.example`,
        );
      }
      return;
    }

    try {
      getFirebaseServices();
      if (__DEV__) {
        console.log('Firebase initialized successfully.');
      }
    } catch (error) {
      console.error('Firebase initialization failed:', error);
    }
  }, []);

  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
