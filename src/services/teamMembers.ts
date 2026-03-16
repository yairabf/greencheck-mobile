import { collection, doc, documentId, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import type { Team } from '../types/team';
import type { UserProfile } from '../types/profile';

export type TeamMember = {
  uid: string;
  name: string;
  phone: string;
  isCreator: boolean;
  isAdmin: boolean;
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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function getTeamMembers(teamId: string) {
  const { firestore } = getFirebaseServices();
  const teamSnap = await getDoc(doc(firestore, 'teams', teamId));
  if (!teamSnap.exists()) return { team: null, members: [] as TeamMember[] };

  const team = toTeam(teamSnap.id, teamSnap.data() as Record<string, unknown>);
  const adminIds: string[] = Array.isArray((teamSnap.data() as any).adminIds)
    ? ((teamSnap.data() as any).adminIds as string[])
    : [team.createdBy];

  const memberSettingsSnap = await getDocs(collection(firestore, 'teams', teamId, 'members'));
  const activeMap: Record<string, boolean> = {};
  memberSettingsSnap.forEach((d) => {
    const row = d.data() as Record<string, unknown>;
    activeMap[d.id] = row.active === false ? false : true;
  });

  const profileMap: Record<string, UserProfile> = {};
  const uidChunks = chunk(team.memberIds, 10);
  await Promise.all(
    uidChunks.map(async (ids) => {
      if (!ids.length) return;
      const snap = await getDocs(query(collection(firestore, 'users'), where(documentId(), 'in', ids)));
      snap.forEach((d) => {
        profileMap[d.id] = toProfile(d.id, d.data() as Record<string, unknown>);
      });
    }),
  );

  const memberProfiles: TeamMember[] = team.memberIds.map((uid) => {
    const p = profileMap[uid];
    if (!p) {
      return { uid, name: 'Unknown member', phone: '', isCreator: uid === team.createdBy, isAdmin: adminIds.includes(uid), active: activeMap[uid] ?? true };
    }
    return {
      uid,
      name: p.name || 'Unnamed',
      phone: p.phone,
      isCreator: uid === team.createdBy,
      isAdmin: adminIds.includes(uid),
      active: activeMap[uid] ?? true,
    };
  });

  memberProfiles.sort((a, b) => {
    if (a.isCreator && !b.isCreator) return -1;
    if (!a.isCreator && b.isCreator) return 1;
    return a.name.localeCompare(b.name);
  });

  return { team, members: memberProfiles };
}

export async function getActiveTeamMemberIds(teamId: string): Promise<string[]> {
  const { firestore } = getFirebaseServices();
  const teamSnap = await getDoc(doc(firestore, 'teams', teamId));
  if (!teamSnap.exists()) return [];

  const memberIds: string[] = Array.isArray(teamSnap.data().memberIds)
    ? teamSnap.data().memberIds.map((x: unknown) => String(x))
    : [];

  const memberSettingsSnap = await getDocs(collection(firestore, 'teams', teamId, 'members'));
  if (memberSettingsSnap.empty) return memberIds;

  const inactive = new Set<string>();
  memberSettingsSnap.forEach((d) => {
    const row = d.data() as Record<string, unknown>;
    if (row.active === false) inactive.add(d.id);
  });

  return memberIds.filter((uid) => !inactive.has(uid));
}

export async function setMyTeamActiveState(teamId: string, uid: string, active: boolean): Promise<void> {
  const { firestore } = getFirebaseServices();
  await setDoc(
    doc(firestore, 'teams', teamId, 'members', uid),
    { active, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
