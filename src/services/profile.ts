import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getFirebaseServices } from './firebase';
import type { UserProfile } from '../types/profile';

function profileRef(uid: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'users', uid);
}

function fromDoc(uid: string, data: DocumentData): UserProfile {
  return {
    uid,
    name: String(data.name ?? ''),
    phone: String(data.phone ?? ''),
    teamIds: Array.isArray(data.teamIds) ? data.teamIds : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(profileRef(uid));
  if (!snap.exists()) return null;
  return fromDoc(uid, snap.data());
}

export async function createUserProfile(user: User, name: string): Promise<void> {
  await setDoc(profileRef(user.uid), {
    name: name.trim(),
    phone: user.phoneNumber ?? '',
    teamIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(uid: string, updates: Pick<UserProfile, 'name'>): Promise<void> {
  await updateDoc(profileRef(uid), {
    name: updates.name.trim(),
    updatedAt: serverTimestamp(),
  });
}
