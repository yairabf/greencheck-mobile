import {
  arrayUnion,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import type { TeamInvite } from '../types/invite';

function inviteRef(code: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'teamInvites', code.toUpperCase());
}

function teamRef(teamId: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'teams', teamId);
}

function userRef(uid: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'users', uid);
}

function codeGen(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function fromInvite(code: string, data: DocumentData): TeamInvite {
  return {
    code,
    teamId: String(data.teamId ?? ''),
    createdBy: String(data.createdBy ?? ''),
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
    active: Boolean(data.active),
  };
}

export async function createTeamInvite(teamId: string, createdBy: string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = codeGen();
    const ref = inviteRef(code);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        teamId,
        createdBy,
        active: true,
        createdAt: serverTimestamp(),
        expiresAt: null,
      });
      return code;
    }
  }
  throw new Error('Failed to generate unique invite code.');
}

export async function getInvite(code: string): Promise<TeamInvite | null> {
  const ref = inviteRef(code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return fromInvite(snap.id, snap.data());
}

export async function joinTeamWithCode(uid: string, code: string): Promise<string> {
  const { firestore } = getFirebaseServices();
  const invRef = inviteRef(code);

  return runTransaction(firestore, async (tx) => {
    const invSnap = await tx.get(invRef);
    if (!invSnap.exists()) throw new Error('Invalid invite code.');
    const inv = invSnap.data();
    if (!inv.active) throw new Error('Invite is inactive.');

    const teamId = String(inv.teamId ?? '');
    if (!teamId) throw new Error('Invite missing team ID.');

    const tRef = teamRef(teamId);
    const uRef = userRef(uid);

    const userSnap = await tx.get(uRef);

    if (!userSnap.exists()) {
      // Auto-bootstrap a minimal profile for legacy/new users before joining team.
      tx.set(uRef, {
        name: '',
        phone: '',
        teamIds: [teamId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      tx.update(tRef, { memberIds: arrayUnion(uid), updatedAt: serverTimestamp() });
      return teamId;
    }

    const userData = userSnap.data();
    const teamIds = Array.isArray(userData.teamIds) ? userData.teamIds : [];

    if (teamIds.includes(teamId)) {
      // idempotent success
      return teamId;
    }

    // Update team membership and user profile atomically.
    // We intentionally do not read team doc here because non-members cannot read it by rules.
    tx.update(tRef, { memberIds: arrayUnion(uid), updatedAt: serverTimestamp() });
    tx.update(uRef, { teamIds: arrayUnion(teamId), updatedAt: serverTimestamp() });
    return teamId;
  });
}
