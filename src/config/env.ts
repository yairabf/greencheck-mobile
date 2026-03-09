import Constants from 'expo-constants';

type Extra = {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
  firebaseApiKey: extra.firebaseApiKey ?? '',
  firebaseAuthDomain: extra.firebaseAuthDomain ?? '',
  firebaseProjectId: extra.firebaseProjectId ?? '',
  firebaseStorageBucket: extra.firebaseStorageBucket ?? '',
  firebaseMessagingSenderId: extra.firebaseMessagingSenderId ?? '',
  firebaseAppId: extra.firebaseAppId ?? '',
} as const;

export const hasFirebaseEnv = Object.values(env).every(Boolean);
