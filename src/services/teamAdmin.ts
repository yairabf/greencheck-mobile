import { arrayRemove, doc, getDoc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getFirebaseServices } from './firebase';

function teamRef(teamId: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'teams', teamId);
}

function userRef(uid: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'users', uid);
}

export async function leaveTeam(teamId: string, uid: string): Promise<void> {
  const { firestore } = getFirebaseServices();
  await runTransaction(firestore, async (tx) => {
    const tRef = teamRef(teamId);
    const uRef = userRef(uid);

    const [tSnap, uSnap] = await Promise.all([tx.get(tRef), tx.get(uRef)]);
    if (!tSnap.exists()) throw new Error('Team not found');
    if (!uSnap.exists()) throw new Error('User not found');

    const memberIds = Array.isArray(tSnap.data().memberIds) ? tSnap.data().memberIds : [];
    const createdBy = String(tSnap.data().createdBy ?? '');

    if (!memberIds.includes(uid)) return;
    if (createdBy === uid) throw new Error('Team creator cannot leave. Transfer/remove members first.');

    tx.update(tRef, {
      memberIds: arrayRemove(uid),
      updatedAt: serverTimestamp(),
    });

    tx.update(uRef, {
      teamIds: arrayRemove(teamId),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function removeTeamMember(teamId: string, actorUid: string, targetUid: string): Promise<void> {
  if (actorUid === targetUid) throw new Error('Use leave team for self removal.');

  const { firestore } = getFirebaseServices();
  await runTransaction(firestore, async (tx) => {
    const tRef = teamRef(teamId);
    const tSnap = await tx.get(tRef);
    if (!tSnap.exists()) throw new Error('Team not found');

    const memberIds = Array.isArray(tSnap.data().memberIds) ? tSnap.data().memberIds : [];
    const createdBy = String(tSnap.data().createdBy ?? '');

    if (!memberIds.includes(actorUid)) throw new Error('Only team members can manage team.');
    if (createdBy !== actorUid) throw new Error('Only team creator can remove members.');
    if (!memberIds.includes(targetUid)) return;
    if (createdBy === targetUid) throw new Error('Cannot remove team creator.');

    tx.update(tRef, {
      memberIds: arrayRemove(targetUid),
      updatedAt: serverTimestamp(),
    });
  });

  // Best effort cleanup for removed user profile teamIds (may fail due rules; user app can self-reconcile later)
  try {
    await updateDoc(userRef(targetUid), {
      teamIds: arrayRemove(teamId),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // no-op
  }
}
