import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import type { Team } from '../types/team';
import type { UserProfile } from '../types/profile';

export type TeamMember = {
  uid: string;
  name: string;
  phone: string;
  isCreator: boolean;
  active: boolean;
};

function toTeam(id: string, data: Record<string, unknown>): Team {
  return {
    id,
    name: String(data.name ?? ''),
    createdBy: String(data.createdBy ?? ''),
    memberIds: Array.isArray(data.memberIds) ? (data.memberIds as string[]) : [],
    activeIncidentId: (data.activeIncidentId as string | null) ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function toProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    name: String(data.name ?? ''),
    phone: String(data.phone ?? ''),
    teamIds: Array.isArray(data.teamIds) ? (data.teamIds as string[]) : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function getTeamMembers(teamId: string) {
  const { firestore } = getFirebaseServices();
  const teamSnap = await getDoc(doc(firestore, 'teams', teamId));
  if (!teamSnap.exists()) return { team: null, members: [] as TeamMember[] };

  const team = toTeam(teamSnap.id, teamSnap.data() as Record<string, unknown>);

  const memberSettingsSnap = await getDocs(collection(firestore, 'teams', teamId, 'members'));
  const activeMap: Record<string, boolean> = {};
  memberSettingsSnap.forEach((d) => {
    const row = d.data() as Record<string, unknown>;
    activeMap[d.id] = row.active === false ? false : true;
  });

  const memberProfiles = await Promise.all(
    team.memberIds.map(async (uid) => {
      const s = await getDoc(doc(firestore, 'users', uid));
      if (!s.exists()) {
        return { uid, name: 'Unknown member', phone: '', isCreator: uid === team.createdBy, active: activeMap[uid] ?? true };
      }
      const p = toProfile(uid, s.data() as Record<string, unknown>);
      return {
        uid,
        name: p.name || 'Unnamed',
        phone: p.phone,
        isCreator: uid === team.createdBy,
        active: activeMap[uid] ?? true,
      };
    }),
  );

  memberProfiles.sort((a, b) => {
    if (a.isCreator && !b.isCreator) return -1;
    if (!a.isCreator && b.isCreator) return 1;
    return a.name.localeCompare(b.name);
  });

  return { team, members: memberProfiles };
}

export async function getActiveTeamMemberIds(teamId: string): Promise<string[]> {
  const { members } = await getTeamMembers(teamId);
  return members.filter((m) => m.active).map((m) => m.uid);
}

export async function setMyTeamActiveState(teamId: string, uid: string, active: boolean): Promise<void> {
  const { firestore } = getFirebaseServices();
  await setDoc(
    doc(firestore, 'teams', teamId, 'members', uid),
    { active, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
