import { env } from './env';

const requiredKeys = [
  'firebaseApiKey',
  'firebaseAuthDomain',
  'firebaseProjectId',
  'firebaseStorageBucket',
  'firebaseMessagingSenderId',
  'firebaseAppId',
] as const;

type EnvKey = (typeof requiredKeys)[number];

export function getMissingEnvKeys(): EnvKey[] {
  return requiredKeys.filter((key) => !env[key]);
}

export function assertFirebaseEnv(): void {
  const missing = getMissingEnvKeys();
  if (missing.length > 0) {
    throw new Error(`Missing Firebase env vars: ${missing.join(', ')}`);
  }
}
