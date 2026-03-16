import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  type User,
} from 'firebase/auth';
import { getFirebaseServices } from './firebase';

export function listenAuthState(callback: (user: User | null) => void) {
  const { auth } = getFirebaseServices();
  return onAuthStateChanged(auth, callback);
}

export async function signInWithEmail(email: string, password: string) {
  const { auth } = getFirebaseServices();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string) {
  const { auth } = getFirebaseServices();
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  const { auth } = getFirebaseServices();
  return signOut(auth);
}

export async function changePassword(newPassword: string) {
  const { auth } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return updatePassword(user, newPassword);
}
