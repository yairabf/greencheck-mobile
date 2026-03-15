import { collection, doc, getDoc, getDocs, query, setDoc, serverTimestamp, where, addDoc } from 'firebase/firestore';
import { getFirebaseServices } from './firebase';

export type NotifyResult = {
  attempted: number;
  sent: number;
  failed: number;
  errors: string[];
};

async function getTeamMemberIds(teamId: string): Promise<string[]> {
  const { firestore } = getFirebaseServices();
  const teamSnap = await getDoc(doc(firestore, 'teams', teamId));
  if (!teamSnap.exists()) return [];
  const memberIds: string[] = Array.isArray(teamSnap.data().memberIds)
    ? teamSnap.data().memberIds.map((x: unknown) => String(x))
    : [];

  const membersSnap = await getDocs(collection(firestore, 'teams', teamId, 'members'));
  if (membersSnap.empty) return memberIds;

  const inactive = new Set<string>();
  membersSnap.forEach((d) => {
    const row = d.data() as Record<string, unknown>;
    if (row.active === false) inactive.add(d.id);
  });

  return memberIds.filter((uid) => !inactive.has(uid));
}

async function enqueuePushDispatch(params: {
  teamId: string;
  incidentId: string;
  type: 'safety_check_started' | 'safety_check_reminder' | 'safety_check_closed' | 'safety_check_red_alert';
  payload?: Record<string, unknown>;
  idempotencyKey: string;
  createdBy: string;
}): Promise<void> {
  const { firestore } = getFirebaseServices();
  await addDoc(collection(firestore, 'pushDispatchRequests'), {
    ...params,
    payload: params.payload ?? {},
    createdBy: params.createdBy,
    createdAt: serverTimestamp(),
  });
}

export async function notifyTeamSafetyCheckStarted(teamId: string, incidentId: string, createdBy: string): Promise<NotifyResult> {
  const memberIds = await getTeamMemberIds(teamId);
  await enqueuePushDispatch({
    teamId,
    incidentId,
    type: 'safety_check_started',
    idempotencyKey: `started_${teamId}_${incidentId}`,
    createdBy,
  });
  return {
    attempted: memberIds.length,
    sent: 0,
    failed: 0,
    errors: ['queued_for_backend'],
  };
}

async function getNoResponseUserIds(teamId: string, incidentId: string): Promise<string[]> {
  const { firestore } = getFirebaseServices();
  const responsesRef = collection(firestore, 'teams', teamId, 'incidents', incidentId, 'responses');
  const snap = await getDocs(query(responsesRef, where('status', '==', 'no_response')));
  return snap.docs.map((d) => d.id);
}

async function isIncidentActive(teamId: string, incidentId: string): Promise<boolean> {
  const { firestore } = getFirebaseServices();
  const tSnap = await getDoc(doc(firestore, 'teams', teamId));
  if (!tSnap.exists()) return false;
  return (tSnap.data().activeIncidentId as string | null) === incidentId;
}

async function reminderCooldownOk(teamId: string, incidentId: string, cooldownMinutes = 2): Promise<boolean> {
  const { firestore } = getFirebaseServices();
  const now = Date.now();
  const bucket = Math.floor(now / (cooldownMinutes * 60 * 1000));
  const key = `${teamId}_${incidentId}_${bucket}`;
  const ref = doc(firestore, 'notificationLogs', key);
  const snap = await getDoc(ref);
  if (snap.exists()) return false;
  await setDoc(ref, { teamId, incidentId, type: 'reminder', createdAt: serverTimestamp() }, { merge: true });
  return true;
}

export async function notifyIncidentReminderNonResponders(teamId: string, incidentId: string, createdBy: string): Promise<NotifyResult> {
  const active = await isIncidentActive(teamId, incidentId);
  if (!active) return { attempted: 0, sent: 0, failed: 0, errors: ['Incident is not active'] };

  const cooldown = await reminderCooldownOk(teamId, incidentId, 2);
  if (!cooldown) return { attempted: 0, sent: 0, failed: 0, errors: ['Reminder cooldown active'] };

  const noRespUserIds = await getNoResponseUserIds(teamId, incidentId);
  if (noRespUserIds.length === 0) return { attempted: 0, sent: 0, failed: 0, errors: [] };

  await enqueuePushDispatch({
    teamId,
    incidentId,
    type: 'safety_check_reminder',
    idempotencyKey: `reminder_${teamId}_${incidentId}_${Math.floor(Date.now() / (2 * 60 * 1000))}`,
    createdBy,
  });

  return {
    attempted: noRespUserIds.length,
    sent: 0,
    failed: 0,
    errors: ['queued_for_backend'],
  };
}

async function closeNotifyDedupOk(teamId: string, incidentId: string): Promise<boolean> {
  const { firestore } = getFirebaseServices();
  const key = `close_${teamId}_${incidentId}`;
  const ref = doc(firestore, 'notificationLogs', key);
  const snap = await getDoc(ref);
  if (snap.exists()) return false;
  await setDoc(ref, { teamId, incidentId, type: 'closed', createdAt: serverTimestamp() }, { merge: true });
  return true;
}

export async function notifyTeamSafetyCheckClosed(
  teamId: string,
  incidentId: string,
  closedBy: string,
  autoClosed: boolean,
  createdBy: string,
  allSafe = false,
): Promise<NotifyResult> {
  const dedup = await closeNotifyDedupOk(teamId, incidentId);
  if (!dedup) return { attempted: 0, sent: 0, failed: 0, errors: ['Close notification already sent'] };

  const memberIds = await getTeamMemberIds(teamId);
  await enqueuePushDispatch({
    teamId,
    incidentId,
    type: 'safety_check_closed',
    payload: { closedBy, autoClosed, allSafe },
    idempotencyKey: `closed_${teamId}_${incidentId}`,
    createdBy,
  });

  return {
    attempted: memberIds.length,
    sent: 0,
    failed: 0,
    errors: ['queued_for_backend'],
  };
}

async function redAlertDedupOk(teamId: string, incidentId: string, reporterUid: string): Promise<boolean> {
  const { firestore } = getFirebaseServices();
  const key = `red_${teamId}_${incidentId}_${reporterUid}`;
  const ref = doc(firestore, 'notificationLogs', key);
  const snap = await getDoc(ref);
  if (snap.exists()) return false;
  await setDoc(ref, { teamId, incidentId, reporterUid, type: 'red_alert', createdAt: serverTimestamp() }, { merge: true });
  return true;
}

export async function notifyTeamRedAlert(
  teamId: string,
  incidentId: string,
  reporterUid: string,
  createdBy: string,
): Promise<NotifyResult> {
  const dedup = await redAlertDedupOk(teamId, incidentId, reporterUid);
  if (!dedup) return { attempted: 0, sent: 0, failed: 0, errors: ['Red alert already sent for this user/incident'] };

  const recipients = (await getTeamMemberIds(teamId)).filter((uid) => uid !== reporterUid);
  await enqueuePushDispatch({
    teamId,
    incidentId,
    type: 'safety_check_red_alert',
    payload: { reportedByUid: reporterUid, excludeUid: reporterUid },
    idempotencyKey: `red_${teamId}_${incidentId}_${reporterUid}`,
    createdBy,
  });

  return {
    attempted: recipients.length,
    sent: 0,
    failed: 0,
    errors: ['queued_for_backend'],
  };
}
