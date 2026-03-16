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
    locale: data.locale === 'he' ? 'he' : 'en',
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
  const baseFromEmail = user.email?.split('@')[0]?.trim() || '';
  const fallback = `User-${user.uid.slice(0, 6)}`;
  const finalName = (name?.trim() || baseFromEmail || fallback).slice(0, 40);

  await setDoc(profileRef(user.uid), {
    name: finalName,
    phone: user.phoneNumber ?? '',
    teamIds: [],
    locale: 'en',
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

export async function updateUserLocale(uid: string, locale: 'en' | 'he'): Promise<void> {
  await setDoc(
    profileRef(uid),
    {
      locale,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
