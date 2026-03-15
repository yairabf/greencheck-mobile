const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const webpush = require('web-push');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

const WEB_PUSH_PUBLIC_KEY = process.env.WEB_PUSH_VAPID_PUBLIC_KEY || '';
const WEB_PUSH_PRIVATE_KEY = process.env.WEB_PUSH_VAPID_PRIVATE_KEY || '';
const WEB_PUSH_SUBJECT = process.env.WEB_PUSH_SUBJECT || 'mailto:yairabc@gmail.com';
const WEB_PUSH_ACTION_URL = process.env.WEB_PUSH_ACTION_URL || 'https://us-central1-greencheck-fa892.cloudfunctions.net/webPushAction';
const WEB_PUSH_ACTION_SECRET = process.env.WEB_PUSH_ACTION_SECRET || '';

if (WEB_PUSH_PUBLIC_KEY && WEB_PUSH_PRIVATE_KEY) {
  webpush.setVapidDetails(WEB_PUSH_SUBJECT, WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY);
}

function isExpoToken(token) {
  return typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));
}

async function getTeamMemberIds(teamId) {
  const team = await db.collection('teams').doc(teamId).get();
  if (!team.exists) return [];
  const memberIds = team.get('memberIds');
  return Array.isArray(memberIds) ? memberIds : [];
}

async function getDestinationsForUsers(userIds) {
  const expoTokens = [];
  const webSubscriptions = [];

  for (const uid of userIds) {
    const snap = await db.collection('users').doc(uid).collection('devices').where('active', '==', true).get();
    snap.forEach((d) => {
      const token = d.get('pushToken');
      if (isExpoToken(token)) expoTokens.push(token);

      const subscription = d.get('webPushSubscription');
      if (subscription && subscription.endpoint && subscription.keys) {
        webSubscriptions.push({ uid, subscription });
      }
    });
  }

  return {
    expoTokens: [...new Set(expoTokens)],
    webSubscriptions,
  };
}

async function validateRequestOwnership(req) {
  const { teamId, createdBy } = req;
  if (!teamId || !createdBy) return { ok: false, reason: 'missing_team_or_creator' };
  const team = await db.collection('teams').doc(teamId).get();
  if (!team.exists) return { ok: false, reason: 'team_not_found' };
  const memberIds = team.get('memberIds');
  if (!Array.isArray(memberIds) || !memberIds.includes(createdBy)) {
    return { ok: false, reason: 'creator_not_team_member' };
  }
  return { ok: true };
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signActionToken(payload) {
  if (!WEB_PUSH_ACTION_SECRET) return '';
  const encoded = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', WEB_PUSH_ACTION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyActionToken(token) {
  if (!token || !WEB_PUSH_ACTION_SECRET) return null;
  const [encoded, sig] = String(token).split('.');
  if (!encoded || !sig) return null;
  const expected = crypto.createHmac('sha256', WEB_PUSH_ACTION_SECRET).update(encoded).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload || typeof payload !== 'object') return null;
    if (!payload.uid || !payload.teamId || !payload.incidentId || !payload.exp) return null;
    if (Date.now() > Number(payload.exp)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function sendExpo(messages) {
  if (!messages.length) return { attempted: 0, sent: 0, failed: 0, errors: [] };
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messages)
  });

  if (!res.ok) return { attempted: messages.length, sent: 0, failed: messages.length, errors: [`HTTP ${res.status}`] };
  const body = await res.json();
  const data = Array.isArray(body.data) ? body.data : [];
  let sent = 0;
  let failed = 0;
  const errors = [];
  data.forEach((t) => {
    if (t.status === 'ok') sent += 1;
    else {
      failed += 1;
      if (t.message) errors.push(t.message);
    }
  });
  if (data.length < messages.length) failed += messages.length - data.length;
  return { attempted: messages.length, sent, failed, errors };
}

async function sendWebPush(destinations, buildPayload) {
  if (!destinations.length) return { attempted: 0, sent: 0, failed: 0, errors: [] };
  if (!WEB_PUSH_PUBLIC_KEY || !WEB_PUSH_PRIVATE_KEY) {
    return { attempted: destinations.length, sent: 0, failed: destinations.length, errors: ['Web push VAPID keys are not configured'] };
  }

  let sent = 0;
  let failed = 0;
  const errors = [];

  await Promise.all(
    destinations.map(async ({ uid, subscription }) => {
      try {
        const payload = buildPayload(uid);
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        sent += 1;
      } catch (err) {
        failed += 1;
        errors.push(err?.message || 'web push failed');
      }
    })
  );

  return { attempted: destinations.length, sent, failed, errors };
}

exports.webPushAction = onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).send('');

  const token = req.query.token || req.body?.token;
  const action = req.query.action || req.body?.action;

  if (!token || !action) return res.status(400).json({ ok: false, error: 'missing_token_or_action' });
  if (!['green', 'not_green'].includes(String(action))) return res.status(400).json({ ok: false, error: 'invalid_action' });

  const payload = verifyActionToken(String(token));
  if (!payload) return res.status(401).json({ ok: false, error: 'invalid_or_expired_token' });

  const { uid, teamId, incidentId } = payload;
  const responseRef = db.collection('teams').doc(teamId).collection('incidents').doc(incidentId).collection('responses').doc(uid);
  const teamRef = db.collection('teams').doc(teamId);

  try {
    await db.runTransaction(async (tx) => {
      const [teamSnap, responseSnap] = await Promise.all([tx.get(teamRef), tx.get(responseRef)]);
      if (!teamSnap.exists) throw new Error('team_not_found');
      const activeIncidentId = teamSnap.get('activeIncidentId');
      if (activeIncidentId !== incidentId) throw new Error('incident_not_active');
      if (!responseSnap.exists) throw new Error('response_not_found');

      const prevRespondedAt = responseSnap.get('respondedAt') || null;
      tx.update(responseRef, {
        status: String(action),
        respondedAt: prevRespondedAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(400).json({ ok: false, error: e?.message || 'action_failed' });
  }
});

exports.dispatchPushRequest = onDocumentCreated('pushDispatchRequests/{requestId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const req = snap.data() || {};
  const { teamId, incidentId, type, payload = {}, idempotencyKey, createdBy } = req;
  if (!teamId || !type || !idempotencyKey || !createdBy) {
    await snap.ref.update({ status: 'failed', error: 'missing_fields', processedAt: admin.firestore.FieldValue.serverTimestamp() });
    return;
  }

  const ownership = await validateRequestOwnership(req);
  if (!ownership.ok) {
    await snap.ref.update({ status: 'failed', error: ownership.reason, processedAt: admin.firestore.FieldValue.serverTimestamp() });
    return;
  }

  const idemRef = db.collection('pushDispatchIdempotency').doc(String(idempotencyKey));
  const idem = await idemRef.get();
  if (idem.exists) {
    await snap.ref.update({ status: 'duplicate', processedAt: admin.firestore.FieldValue.serverTimestamp() });
    return;
  }
  await idemRef.set({ createdAt: admin.firestore.FieldValue.serverTimestamp(), requestId: snap.id });

  const members = await getTeamMemberIds(teamId);
  const { expoTokens, webSubscriptions } = await getDestinationsForUsers(members);

  const title = type === 'safety_check_started' ? 'Safety Check Started'
    : type === 'safety_check_reminder' ? 'Reminder: Safety Check Pending'
    : 'Safety Check Closed';

  const body = type === 'safety_check_started' ? 'Tap to report your status now.'
    : type === 'safety_check_reminder' ? 'Please tap and report your status.'
    : (payload.autoClosed ? 'All teammates responded. Safety check closed.' : 'Safety check was ended by a teammate.');

  const expoMessages = expoTokens.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data: { type, teamId, incidentId, ...payload }
  }));

  const [expoResult, webResult] = await Promise.all([
    sendExpo(expoMessages),
    sendWebPush(webSubscriptions, (uid) => {
      const actionToken = signActionToken({
        uid,
        teamId,
        incidentId,
        exp: Date.now() + 1000 * 60 * 60 * 4,
      });

      return {
        title,
        body,
        data: {
          type,
          teamId,
          incidentId,
          ...payload,
          actionToken,
          actionUrl: WEB_PUSH_ACTION_URL,
        },
        actions: [
          { action: 'green', title: '✅ Green' },
          { action: 'not_green', title: '🟥 Not Green' }
        ]
      };
    })
  ]);

  await snap.ref.update({
    status: 'processed',
    result: {
      expo: expoResult,
      web: webResult,
    },
    tokenCount: expoTokens.length,
    webSubscriptionCount: webSubscriptions.length,
    processedAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
