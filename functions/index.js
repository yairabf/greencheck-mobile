const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const webpush = require('web-push');

admin.initializeApp();
const db = admin.firestore();

const WEB_PUSH_PUBLIC_KEY = process.env.WEB_PUSH_VAPID_PUBLIC_KEY || '';
const WEB_PUSH_PRIVATE_KEY = process.env.WEB_PUSH_VAPID_PRIVATE_KEY || '';
const WEB_PUSH_SUBJECT = process.env.WEB_PUSH_SUBJECT || 'mailto:yairabc@gmail.com';

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
        webSubscriptions.push(subscription);
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

async function sendWebPush(subscriptions, payload) {
  if (!subscriptions.length) return { attempted: 0, sent: 0, failed: 0, errors: [] };
  if (!WEB_PUSH_PUBLIC_KEY || !WEB_PUSH_PRIVATE_KEY) {
    return { attempted: subscriptions.length, sent: 0, failed: subscriptions.length, errors: ['Web push VAPID keys are not configured'] };
  }

  let sent = 0;
  let failed = 0;
  const errors = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        sent += 1;
      } catch (err) {
        failed += 1;
        errors.push(err?.message || 'web push failed');
      }
    })
  );

  return { attempted: subscriptions.length, sent, failed, errors };
}

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

  const webPayload = {
    title,
    body,
    data: { type, teamId, incidentId, ...payload },
    actions: [
      { action: 'green', title: '✅ Green' },
      { action: 'not_green', title: '🟥 Not Green' }
    ]
  };

  const [expoResult, webResult] = await Promise.all([
    sendExpo(expoMessages),
    sendWebPush(webSubscriptions, webPayload)
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
