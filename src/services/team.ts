import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import type { Team } from '../types/team';

function teamsCol() {
  const { firestore } = getFirebaseServices();
  return collection(firestore, 'teams');
}

function teamDoc(teamId: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'teams', teamId);
}

function userDoc(uid: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'users', uid);
}

function fromDoc(id: string, data: DocumentData): Team {
  return {
    id,
    name: String(data.name ?? ''),
    createdBy: String(data.createdBy ?? ''),
    memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
    activeIncidentId: (data.activeIncidentId as string | null) ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createTeamForUser(uid: string, teamName: string): Promise<string> {
  const { firestore } = getFirebaseServices();
  const newRef = doc(teamsCol());
  const userRef = userDoc(uid);

  await runTransaction(firestore, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) {
      throw new Error('User profile not found. Complete profile setup first.');
    }

    tx.set(newRef, {
      name: teamName.trim(),
      createdBy: uid,
      memberIds: [uid],
      activeIncidentId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.set(doc(firestore, 'teams', newRef.id, 'members', uid), {
      active: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    const u = userSnap.data();
    const existingTeamIds = Array.isArray(u.teamIds) ? u.teamIds : [];
    if (existingTeamIds.includes(newRef.id)) {
      throw new Error('Team already attached to profile.');
    }

    tx.update(userRef, {
      teamIds: arrayUnion(newRef.id),
      updatedAt: serverTimestamp(),
    });
  });

  return newRef.id;
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const snap = await getDoc(teamDoc(teamId));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}
