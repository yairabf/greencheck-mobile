import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
  type User,
  RecaptchaVerifier,
} from 'firebase/auth';
import { getFirebaseServices } from './firebase';
import { flags } from '../config/env';

export function listenAuthState(callback: (user: User | null) => void) {
  const { auth } = getFirebaseServices();
  return onAuthStateChanged(auth, callback);
}

export async function requestOtp(phoneNumber: string, appVerifier: unknown) {
  const { auth } = getFirebaseServices();
  let verifier: unknown = appVerifier;

  if (flags.authTestMode) {
    // VM/dev test mode: bypass reCAPTCHA requirement for phone auth flows.
    // Use ONLY in non-production environments.
    (auth as any).settings = (auth as any).settings || {};
    (auth as any).settings.appVerificationDisabledForTesting = true;

    // On web, Firebase still expects a verifier object for signInWithPhoneNumber.
    if (!verifier && typeof window !== 'undefined') {
      verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    }
  }

  return signInWithPhoneNumber(auth, phoneNumber, verifier as never);
}

export async function confirmOtp(confirmation: ConfirmationResult, code: string) {
  return confirmation.confirm(code);
}

export async function logout() {
  const { auth } = getFirebaseServices();
  await signOut(auth);
}
