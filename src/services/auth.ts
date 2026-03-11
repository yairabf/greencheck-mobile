import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { getFirebaseServices } from './firebase';
import { flags } from '../config/env';

export function listenAuthState(callback: (user: User | null) => void) {
  const { auth } = getFirebaseServices();
  return onAuthStateChanged(auth, callback);
}

export async function requestOtp(phoneNumber: string, appVerifier: unknown) {
  const { auth } = getFirebaseServices();

  if (flags.authTestMode) {
    // VM/dev test mode: bypass reCAPTCHA requirement for phone auth flows.
    // Use ONLY in non-production environments.
    (auth as any).settings = (auth as any).settings || {};
    (auth as any).settings.appVerificationDisabledForTesting = true;
  }

  return signInWithPhoneNumber(auth, phoneNumber, appVerifier as never);
}

export async function confirmOtp(confirmation: ConfirmationResult, code: string) {
  return confirmation.confirm(code);
}

export async function logout() {
  const { auth } = getFirebaseServices();
  await signOut(auth);
}
