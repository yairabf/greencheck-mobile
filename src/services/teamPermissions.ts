import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseServices } from './firebase';

export type TeamAdminState = {
  createdBy: string;
  adminIds: string[];
  memberIds: string[];
};

function teamRef(teamId: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'teams', teamId);
}

export async function getTeamAdminState(teamId: string): Promise<TeamAdminState> {
  const snap = await getDoc(teamRef(teamId));
  if (!snap.exists()) throw new Error('Team not found');

  const data = snap.data() as Record<string, unknown>;
  const createdBy = String(data.createdBy ?? '');
  const memberIds = Array.isArray(data.memberIds) ? data.memberIds.map((x) => String(x)) : [];
  const rawAdminIds = Array.isArray(data.adminIds) ? data.adminIds.map((x) => String(x)) : [];
  const adminIds = Array.from(new Set([createdBy, ...rawAdminIds]));

  return { createdBy, adminIds, memberIds };
}

export async function isTeamAdmin(teamId: string, uid: string): Promise<boolean> {
  const state = await getTeamAdminState(teamId);
  return state.adminIds.includes(uid);
}

// One-time style self-heal: persist normalized adminIds so legacy teams stop drifting.
export async function ensureTeamAdminIdsPersisted(teamId: string): Promise<void> {
  const { createdBy, adminIds } = await getTeamAdminState(teamId);
  const normalized = Array.from(new Set([createdBy, ...adminIds]));
  await setDoc(teamRef(teamId), { adminIds: normalized, updatedAt: serverTimestamp() }, { merge: true });
}
