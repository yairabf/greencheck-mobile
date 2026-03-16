import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import { notifyTeamRedAlert, notifyTeamSafetyCheckClosed } from './notify';
import { logEvent } from './observability';
import { getActiveTeamMemberIds } from './teamMembers';
import type { Incident } from '../types/incident';

export type LastIncidentSummary = {
  incidentId: string;
  triggeredBy: string;
  triggeredAt?: unknown;
  endedBy: string;
  endedAt?: unknown;
  autoClosed: boolean;
  allSafe: boolean;
};

export type ResponseCounts = {
  green: number;
  not_green: number;
  no_response: number;
};

export type ResponseStatus = 'green' | 'not_green';


export type IncidentErrorCode =
  | 'INCIDENT_ALREADY_ACTIVE'
  | 'INCIDENT_STALE'
  | 'INCIDENT_NOT_ACTIVE';

export class IncidentError extends Error {
  code: IncidentErrorCode;
  constructor(code: IncidentErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}


function teamRef(teamId: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'teams', teamId);
}

function incidentsCol(teamId: string) {
  const { firestore } = getFirebaseServices();
  return collection(firestore, 'teams', teamId, 'incidents');
}

function incidentRef(teamId: string, incidentId: string) {
  const { firestore } = getFirebaseServices();
  return doc(firestore, 'teams', teamId, 'incidents', incidentId);
}

function fromIncident(teamId: string, id: string, data: DocumentData): Incident {
  return {
    id,
    teamId,
    status: (data.status as 'active' | 'closed') ?? 'active',
    triggeredBy: String(data.triggeredBy ?? ''),
    triggeredAt: data.triggeredAt,
    endedBy: (data.endedBy as string | null) ?? null,
    endedAt: data.endedAt,
    autoClosed: Boolean(data.autoClosed),
    allSafe: Boolean(data.allSafe),
  };
}

export async function triggerSafetyCheck(teamId: string, uid: string): Promise<string> {
  const { firestore } = getFirebaseServices();
  const tRef = teamRef(teamId);
  const iRef = doc(incidentsCol(teamId));

  await runTransaction(firestore, async (tx) => {
    const tSnap = await tx.get(tRef);
    if (!tSnap.exists()) throw new Error('Team not found.');

    const tData = tSnap.data();
    const activeIncidentId = (tData.activeIncidentId as string | null) ?? null;
    if (activeIncidentId) {
      throw new IncidentError('INCIDENT_ALREADY_ACTIVE', 'An active safety check already exists.');
    }

    tx.set(iRef, {
      status: 'active',
      triggeredBy: uid,
      triggeredAt: serverTimestamp(),
      endedBy: null,
      endedAt: null,
      autoClosed: false,
    });

    const activeMemberIds = await getActiveTeamMemberIds(teamId);
    for (const memberUid of activeMemberIds) {
      const rRef = doc(incidentsCol(teamId), iRef.id, 'responses', String(memberUid));
      tx.set(rRef, {
        status: 'no_response',
        respondedAt: null,
        updatedAt: serverTimestamp(),
      });
    }

    tx.update(tRef, {
      activeIncidentId: iRef.id,
      updatedAt: serverTimestamp(),
    });
  });

  return iRef.id;
}

export async function getActiveIncident(teamId: string): Promise<Incident | null> {
  const tSnap = await getDoc(teamRef(teamId));
  if (!tSnap.exists()) return null;
  const activeIncidentId = (tSnap.data().activeIncidentId as string | null) ?? null;
  if (!activeIncidentId) return null;

  const iSnap = await getDoc(incidentRef(teamId, activeIncidentId));
  if (!iSnap.exists()) return null;
  return fromIncident(teamId, iSnap.id, iSnap.data());
}

export async function getLastIncidentSummary(teamId: string): Promise<LastIncidentSummary | null> {
  const tSnap = await getDoc(teamRef(teamId));
  if (!tSnap.exists()) return null;
  const s = (tSnap.data() as DocumentData).lastIncidentSummary;
  if (!s || typeof s !== 'object') return null;
  return {
    incidentId: String(s.incidentId ?? ''),
    triggeredBy: String(s.triggeredBy ?? ''),
    triggeredAt: s.triggeredAt,
    endedBy: String(s.endedBy ?? ''),
    endedAt: s.endedAt,
    autoClosed: Boolean(s.autoClosed),
    allSafe: Boolean(s.allSafe),
  };
}


export async function getIncidentResponseCounts(teamId: string, incidentId: string): Promise<ResponseCounts> {
  const { firestore } = getFirebaseServices();
  const q = collection(firestore, 'teams', teamId, 'incidents', incidentId, 'responses');
  const snap = await getDocs(q);

  const counts: ResponseCounts = { green: 0, not_green: 0, no_response: 0 };
  snap.forEach((docSnap) => {
    const status = String(docSnap.data().status ?? 'no_response');
    if (status === 'green') counts.green += 1;
    else if (status === 'not_green') counts.not_green += 1;
    else counts.no_response += 1;
  });

  return counts;
}


export async function submitMyStatus(
  teamId: string,
  incidentId: string,
  uid: string,
  status: ResponseStatus,
): Promise<void> {
  const { firestore } = getFirebaseServices();
  const responseRef = doc(firestore, 'teams', teamId, 'incidents', incidentId, 'responses', uid);
  const tRef = teamRef(teamId);

  await runTransaction(firestore, async (tx) => {
    const snap = await tx.get(responseRef);
    const teamSnap = await tx.get(tRef);
    if (!teamSnap.exists()) throw new IncidentError('INCIDENT_STALE', 'Team not found.');
    const teamData = teamSnap.data() as DocumentData;
    const activeIncidentId = (teamData.activeIncidentId as string | null) ?? null;
    if (activeIncidentId !== incidentId) {
      throw new IncidentError('INCIDENT_STALE', 'Incident is no longer active.');
    }
    if (!snap.exists()) {
      throw new IncidentError('INCIDENT_STALE', 'Response doc not found for current user.');
    }

    const prevRespondedAt = snap.data().respondedAt ?? null;
    tx.update(responseRef, {
      status,
      respondedAt: prevRespondedAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  if (status === 'not_green') {
    void notifyTeamRedAlert(teamId, incidentId, uid, uid);
  }

  await autoCloseIfComplete(teamId, incidentId);
}


export type IncidentResponseMap = Record<string, {
  status: 'green' | 'not_green' | 'no_response';
  updatedAt?: unknown;
  respondedAt?: unknown;
}>;

export function subscribeIncidentResponses(
  teamId: string,
  incidentId: string,
  onData: (map: IncidentResponseMap) => void,
  onError?: (e: Error) => void,
) {
  const { firestore } = getFirebaseServices();
  const ref = collection(firestore, 'teams', teamId, 'incidents', incidentId, 'responses');

  return onSnapshot(
    ref,
    (snap) => {
      const next: IncidentResponseMap = {};
      snap.forEach((d) => {
        const row = d.data();
        const status = String(row.status ?? 'no_response') as 'green' | 'not_green' | 'no_response';
        next[d.id] = { status, updatedAt: row.updatedAt, respondedAt: row.respondedAt };
      });
      onData(next);
    },
    (err) => onError?.(err),
  );
}


export async function autoCloseIfComplete(teamId: string, incidentId: string): Promise<boolean> {
  const { firestore } = getFirebaseServices();
  const tRef = teamRef(teamId);
  const iRef = incidentRef(teamId, incidentId);

  const closeResult = await runTransaction(firestore, async (tx) => {
    const [tSnap, iSnap] = await Promise.all([tx.get(tRef), tx.get(iRef)]);
    if (!tSnap.exists() || !iSnap.exists()) return { closed: false, allSafe: false };

    const tData = tSnap.data();
    const iData = iSnap.data();

    const activeIncidentId = (tData.activeIncidentId as string | null) ?? null;
    const incidentStatus = String(iData.status ?? 'active');

    // idempotent guard: already closed or team moved on
    if (incidentStatus !== 'active') throw new IncidentError('INCIDENT_NOT_ACTIVE', 'Incident is already closed.');
    if (activeIncidentId !== incidentId) throw new IncidentError('INCIDENT_STALE', 'Incident is no longer active.');

    const responsesRef = collection(firestore, 'teams', teamId, 'incidents', incidentId, 'responses');
    const responsesSnap = await getDocs(query(responsesRef));

    if (responsesSnap.empty) return { closed: false, allSafe: false };

    let hasNoResponse = false;
    let hasNotGreen = false;
    responsesSnap.forEach((d) => {
      const status = String(d.data().status ?? 'no_response');
      if (status === 'no_response') hasNoResponse = true;
      if (status === 'not_green') hasNotGreen = true;
    });

    if (hasNoResponse) return { closed: false, allSafe: false };

    tx.update(iRef, {
      status: 'closed',
      endedBy: 'system:auto',
      endedAt: serverTimestamp(),
      autoClosed: true,
      allSafe: !hasNotGreen,
    });

    tx.update(tRef, {
      activeIncidentId: null,
      lastIncidentSummary: {
        incidentId,
        triggeredBy: String(iData.triggeredBy ?? 'unknown'),
        triggeredAt: iData.triggeredAt ?? null,
        endedBy: 'system:auto',
        endedAt: serverTimestamp(),
        autoClosed: true,
        allSafe: !hasNotGreen,
      },
      updatedAt: serverTimestamp(),
    });

    return { closed: true, allSafe: !hasNotGreen };
  });

  if (closeResult.closed) {
    void notifyTeamSafetyCheckClosed(teamId, incidentId, 'system:auto', true, 'system:auto', closeResult.allSafe);
    void logEvent({ teamId, incidentId, type: 'incident_closed_auto', actor: 'system:auto', meta: { allSafe: closeResult.allSafe } });
  }

  return closeResult.closed;
}


export async function endSafetyCheck(
  teamId: string,
  incidentId: string,
  endedByUid: string,
): Promise<boolean> {
  const { firestore } = getFirebaseServices();
  const tRef = teamRef(teamId);
  const iRef = incidentRef(teamId, incidentId);

  const closed = await runTransaction(firestore, async (tx) => {
    const [tSnap, iSnap] = await Promise.all([tx.get(tRef), tx.get(iRef)]);
    if (!tSnap.exists() || !iSnap.exists()) return false;

    const tData = tSnap.data();
    const iData = iSnap.data();

    const activeIncidentId = (tData.activeIncidentId as string | null) ?? null;
    const incidentStatus = String(iData.status ?? 'active');

    // idempotent/race-safe guards
    if (incidentStatus !== 'active') throw new IncidentError('INCIDENT_NOT_ACTIVE', 'Incident is already closed.');
    if (activeIncidentId !== incidentId) throw new IncidentError('INCIDENT_STALE', 'Incident is no longer active.');

    tx.update(iRef, {
      status: 'closed',
      endedBy: endedByUid,
      endedAt: serverTimestamp(),
      autoClosed: false,
      allSafe: false,
    });

    tx.update(tRef, {
      activeIncidentId: null,
      lastIncidentSummary: {
        incidentId,
        triggeredBy: String(iData.triggeredBy ?? 'unknown'),
        triggeredAt: iData.triggeredAt ?? null,
        endedBy: endedByUid,
        endedAt: serverTimestamp(),
        autoClosed: false,
        allSafe: false,
      },
      updatedAt: serverTimestamp(),
    });

    return true;
  });

  if (closed) {
    void logEvent({ teamId, incidentId, type: 'incident_closed_manual', actor: endedByUid });
  }

  return closed;
}


export async function reconcileActiveIncidentPointer(teamId: string): Promise<boolean> {
  const { firestore } = getFirebaseServices();
  const tRef = teamRef(teamId);

  return runTransaction(firestore, async (tx) => {
    const tSnap = await tx.get(tRef);
    if (!tSnap.exists()) return false;

    const activeIncidentId = (tSnap.data().activeIncidentId as string | null) ?? null;
    if (!activeIncidentId) return false;

    const iRef = incidentRef(teamId, activeIncidentId);
    const iSnap = await tx.get(iRef);

    if (!iSnap.exists()) {
      tx.update(tRef, { activeIncidentId: null, updatedAt: serverTimestamp() });
      return true;
    }

    const status = String(iSnap.data().status ?? 'active');
    if (status !== 'active') {
      tx.update(tRef, { activeIncidentId: null, updatedAt: serverTimestamp() });
      return true;
    }

    return false;
  });
}


export async function listIncidents(teamId: string): Promise<Incident[]> {
  const { firestore } = getFirebaseServices();
  const q = query(collection(firestore, 'teams', teamId, 'incidents'), orderBy('triggeredAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromIncident(teamId, d.id, d.data()));
}


export async function verifyIncidentInvariants(teamId: string): Promise<{
  ok: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  const { firestore } = getFirebaseServices();
  const tSnap = await getDoc(teamRef(teamId));
  if (!tSnap.exists()) return { ok: false, issues: ['TEAM_NOT_FOUND'] };

  const activeIncidentId = (tSnap.data().activeIncidentId as string | null) ?? null;
  if (!activeIncidentId) return { ok: true, issues };

  const iSnap = await getDoc(incidentRef(teamId, activeIncidentId));
  if (!iSnap.exists()) {
    issues.push('ACTIVE_POINTER_MISSING_DOC');
    return { ok: false, issues };
  }

  const status = String(iSnap.data().status ?? 'active');
  if (status !== 'active') {
    issues.push('ACTIVE_POINTER_NOT_ACTIVE_STATUS');
  }

  return { ok: issues.length === 0, issues };
}
