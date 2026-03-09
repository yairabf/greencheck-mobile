import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { env } from '../config/env';
import { assertFirebaseEnv } from '../config/validateEnv';

let firebaseApp: FirebaseApp | null = null;

function initFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;

  assertFirebaseEnv();

  const config = {
    apiKey: env.firebaseApiKey,
    authDomain: env.firebaseAuthDomain,
    projectId: env.firebaseProjectId,
    storageBucket: env.firebaseStorageBucket,
    messagingSenderId: env.firebaseMessagingSenderId,
    appId: env.firebaseAppId,
  };

  firebaseApp = getApps().length ? getApp() : initializeApp(config);
  return firebaseApp;
}

export function getFirebaseServices() {
  const app = initFirebaseApp();
  return {
    app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}
