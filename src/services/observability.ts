import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { getFirebaseServices } from './firebase';

type EventType =
  | 'incident_triggered'
  | 'status_submitted'
  | 'reminder_sent'
  | 'incident_closed_manual'
  | 'incident_closed_auto'
  | 'push_sent';

export async function logEvent(params: {
  teamId: string;
  incidentId?: string;
  type: EventType;
  actor?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    const { firestore } = getFirebaseServices();
    await addDoc(collection(firestore, 'eventLogs'), {
      teamId: params.teamId,
      incidentId: params.incidentId ?? null,
      type: params.type,
      actor: params.actor ?? null,
      meta: params.meta ?? {},
      createdAt: serverTimestamp(),
    });
  } catch {
    // non-blocking by design
  }
}

export type TeamMetrics = {
  incidentCount: number;
  closeAuto: number;
  closeManual: number;
  statusSubmissions: number;
  remindersSent: number;
  pushAttempts: number;
};

export async function getTeamMetrics(teamId: string): Promise<TeamMetrics> {
  const { firestore } = getFirebaseServices();
  const snap = await getDocs(query(collection(firestore, 'eventLogs'), where('teamId', '==', teamId)));

  const out: TeamMetrics = {
    incidentCount: 0,
    closeAuto: 0,
    closeManual: 0,
    statusSubmissions: 0,
    remindersSent: 0,
    pushAttempts: 0,
  };

  snap.forEach((d) => {
    const t = String(d.data().type ?? '');
    if (t === 'incident_triggered') out.incidentCount += 1;
    if (t === 'incident_closed_auto') out.closeAuto += 1;
    if (t === 'incident_closed_manual') out.closeManual += 1;
    if (t === 'status_submitted') out.statusSubmissions += 1;
    if (t === 'reminder_sent') out.remindersSent += 1;
    if (t === 'push_sent') out.pushAttempts += 1;
  });

  return out;
}
