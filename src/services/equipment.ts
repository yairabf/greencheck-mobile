import { collection, doc, getDoc, getDocs, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseServices } from './firebase';

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
  const { firestore } = getFirebaseServices();

  await runTransaction(firestore, async (tx) => {
    const tSnap = await tx.get(teamRef(teamId));
    if (!tSnap.exists()) throw new Error('Team not found');

    const createdBy = String(tSnap.data().createdBy ?? '');
    const adminIds = Array.isArray(tSnap.data().adminIds) ? tSnap.data().adminIds : [createdBy];
    if (!adminIds.includes(actorUid)) throw new Error('Only team admin can create equipment');

    // enforce unique serial per team
    const existing = await getDocs(query(equipmentCol(teamId)));
    for (const d of existing.docs) {
      if (String(d.data().serialNumber ?? '').toLowerCase() === serialNumber.trim().toLowerCase()) {
        throw new Error('Serial number already exists');
      }
    }

    tx.set(itemRef, {
      name: name.trim(),
      serialNumber: serialNumber.trim(),
      assignedToUid: null,
      status: 'stored',
      createdBy: actorUid,
      createdAt: serverTimestamp(),
      updatedBy: actorUid,
      updatedAt: serverTimestamp(),
    });
  });

  return itemRef.id;
}

export async function assignEquipment(teamId: string, equipmentId: string, actorUid: string, assignedToUid: string | null): Promise<void> {
  const { firestore } = getFirebaseServices();
  await runTransaction(firestore, async (tx) => {
    const tSnap = await tx.get(teamRef(teamId));
    if (!tSnap.exists()) throw new Error('Team not found');
    const createdBy = String(tSnap.data().createdBy ?? '');
    const adminIds = Array.isArray(tSnap.data().adminIds) ? tSnap.data().adminIds : [createdBy];
    if (!adminIds.includes(actorUid)) throw new Error('Only team admin can assign equipment');

    const memberIds = Array.isArray(tSnap.data().memberIds) ? tSnap.data().memberIds : [];
    if (assignedToUid && !memberIds.includes(assignedToUid)) throw new Error('Assignee must be a team member');

    tx.update(equipmentRef(teamId, equipmentId), {
      assignedToUid: assignedToUid ?? null,
      updatedBy: actorUid,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function updateEquipmentStatus(teamId: string, equipmentId: string, actorUid: string, status: EquipmentStatus): Promise<void> {
  const ref = equipmentRef(teamId, equipmentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Equipment not found');

  const row = snap.data() as Record<string, unknown>;
  const assignedToUid = row.assignedToUid ? String(row.assignedToUid) : null;

  const tSnap = await getDoc(teamRef(teamId));
  if (!tSnap.exists()) throw new Error('Team not found');
  const createdBy = String(tSnap.data().createdBy ?? '');
  const adminIds = Array.isArray(tSnap.data().adminIds) ? tSnap.data().adminIds : [createdBy];

  if (!(assignedToUid === actorUid || adminIds.includes(actorUid))) {
    throw new Error('Only assignee or admin can update status');
  }

  await updateDoc(ref, {
    status,
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  });
}
