import Constants from 'expo-constants';

type Extra = {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  enableClientPush?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
  firebaseApiKey: extra.firebaseApiKey ?? '',
  firebaseAuthDomain: extra.firebaseAuthDomain ?? '',
  firebaseProjectId: extra.firebaseProjectId ?? '',
  firebaseStorageBucket: extra.firebaseStorageBucket ?? '',
  firebaseMessagingSenderId: extra.firebaseMessagingSenderId ?? '',
  firebaseAppId: extra.firebaseAppId ?? '',
  enableClientPush: extra.enableClientPush ?? 'false',
  authTestMode: (extra as any).authTestMode ?? process.env.EXPO_PUBLIC_AUTH_TEST_MODE ?? 'false',
} as const;

export const hasFirebaseEnv = Object.values(env).every(Boolean);


export const flags = {
  enableClientPush: String(env.enableClientPush).toLowerCase() === 'true',
  authTestMode: String(env.authTestMode).toLowerCase() === 'true',
} as const;
