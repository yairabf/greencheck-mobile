import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { getMissingEnvKeys } from './src/config/validateEnv';
import { getFirebaseServices } from './src/services/firebase';
import { AuthProvider } from './src/services/AuthProvider';
import { ProfileProvider } from './src/services/ProfileProvider';
import { PushProvider } from './src/services/PushProvider';
import { I18nProvider } from './src/i18n';

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
    <I18nProvider>
      <AuthProvider>
        <ProfileProvider>
          <PushProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </PushProvider>
        </ProfileProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

