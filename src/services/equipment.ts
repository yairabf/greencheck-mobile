import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import { ensureTeamAdminIdsPersisted, getTeamAdminState, isTeamAdmin } from './teamPermissions';

export type EquipmentStatus = 'in_possession' | 'stored';

export type EquipmentItem = {
  id: string;
  name: string;
  serialNumber: string;
  assignedToUid: string | null;
  status: EquipmentStatus;
  createdBy: string;
  createdAt?: unknown;
  updatedBy: string;
  updatedAt?: unknown;
};

function equipmentCol(teamId: string) {
  const { firestore } = getFirebaseServices();
  return collection(firestore, 'teams', teamId, 'equipment');
}

function equipmentRef(teamId: string, equipmentId: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'teams', teamId, 'equipment', equipmentId);
}

function teamRef(teamId: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'teams', teamId);
}

function fromDoc(id: string, data: Record<string, unknown>): EquipmentItem {
  return {
    id,
    name: String(data.name ?? ''),
    serialNumber: String(data.serialNumber ?? ''),
    assignedToUid: data.assignedToUid ? String(data.assignedToUid) : null,
    status: (data.status as EquipmentStatus) ?? 'stored',
    createdBy: String(data.createdBy ?? ''),
    createdAt: data.createdAt,
    updatedBy: String(data.updatedBy ?? ''),
    updatedAt: data.updatedAt,
  };
}

export async function listEquipment(teamId: string): Promise<EquipmentItem[]> {
  const q = query(equipmentCol(teamId), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>));
}

export async function createEquipment(teamId: string, actorUid: string, name: string, serialNumber: string): Promise<string> {
  const itemRef = doc(equipmentCol(teamId));

  await ensureTeamAdminIdsPersisted(teamId);
  const teamState = await getTeamAdminState(teamId);
  if (!teamState.adminIds.includes(actorUid)) throw new Error('Only team admin can create equipment');

  // enforce unique serial per team
  const existing = await getDocs(query(equipmentCol(teamId)));
  const normalized = serialNumber.trim().toLowerCase();
  for (const d of existing.docs) {
    if (String(d.data().serialNumber ?? '').trim().toLowerCase() === normalized) {
      throw new Error('Serial number already exists');
    }
  }

  await setDoc(itemRef, {
    name: name.trim(),
    serialNumber: serialNumber.trim(),
    assignedToUid: null,
    status: 'stored',
    createdBy: actorUid,
    createdAt: serverTimestamp(),
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  });

  return itemRef.id;
}

export async function assignEquipment(teamId: string, equipmentId: string, actorUid: string, assignedToUid: string | null): Promise<void> {
  await ensureTeamAdminIdsPersisted(teamId);
  const admin = await isTeamAdmin(teamId, actorUid);
  if (!admin) throw new Error('Only team admin can assign equipment');

  const teamState = await getTeamAdminState(teamId);
  if (assignedToUid && !teamState.memberIds.includes(assignedToUid)) throw new Error('Assignee must be a team member');

  await updateDoc(equipmentRef(teamId, equipmentId), {
    assignedToUid: assignedToUid ?? null,
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  });
}

export async function updateEquipmentStatus(teamId: string, equipmentId: string, actorUid: string, status: EquipmentStatus): Promise<void> {
  const ref = equipmentRef(teamId, equipmentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Equipment not found');

  const row = snap.data() as Record<string, unknown>;
  const assignedToUid = row.assignedToUid ? String(row.assignedToUid) : null;

  await ensureTeamAdminIdsPersisted(teamId);
  const admin = await isTeamAdmin(teamId, actorUid);

  if (!(assignedToUid === actorUid || admin)) {
    throw new Error('Only assignee or admin can update status');
  }

  await updateDoc(ref, {
    status,
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  });
}

export async function editEquipment(teamId: string, equipmentId: string, actorUid: string, updates: { name: string; serialNumber: string }): Promise<void> {
  await ensureTeamAdminIdsPersisted(teamId);
  const admin = await isTeamAdmin(teamId, actorUid);
  if (!admin) throw new Error('Only team admin can edit equipment');

  const all = await listEquipment(teamId);
  const normalized = updates.serialNumber.trim().toLowerCase();
  for (const item of all) {
    if (item.id !== equipmentId && item.serialNumber.trim().toLowerCase() === normalized) {
      throw new Error('Serial number already exists');
    }
  }

  await updateDoc(equipmentRef(teamId, equipmentId), {
    name: updates.name.trim(),
    serialNumber: updates.serialNumber.trim(),
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEquipment(teamId: string, equipmentId: string, actorUid: string): Promise<void> {
  await ensureTeamAdminIdsPersisted(teamId);
  const admin = await isTeamAdmin(teamId, actorUid);
  if (!admin) throw new Error('Only team admin can delete equipment');

  await deleteDoc(equipmentRef(teamId, equipmentId));
}
