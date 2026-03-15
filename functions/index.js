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
  const all = Array.isArray(memberIds) ? memberIds : [];

  const membersSnap = await db.collection('teams').doc(teamId).collection('members').get();
  if (membersSnap.empty) return all;

  const inactive = new Set();
  membersSnap.forEach((d) => {
    const row = d.data() || {};
    if (row.active === false) inactive.add(d.id);
  });

  return all.filter((uid) => !inactive.has(uid));
}

async function getDestinationsForUsers(userIds) {
  const expoDestinations = [];
  const webSubscriptions = [];

  const [userSnaps, deviceSnaps] = await Promise.all([
    Promise.all(userIds.map((uid) => db.collection('users').doc(uid).get())),
    Promise.all(userIds.map((uid) => db.collection('users').doc(uid).collection('devices').where('active', '==', true).get())),
  ]);

  for (let i = 0; i < userIds.length; i += 1) {
    const uid = userIds[i];
    const locale = userSnaps[i].exists && userSnaps[i].get('locale') === 'he' ? 'he' : 'en';
    const snap = deviceSnaps[i];

    snap.forEach((d) => {
      const token = d.get('pushToken');
      if (isExpoToken(token)) expoDestinations.push({ uid, token, locale });

      const subscription = d.get('webPushSubscription');
      if (subscription && subscription.endpoint && subscription.keys) {
        webSubscriptions.push({ uid, locale, subscription });
      }
    });
  }

  const seenTokens = new Set();
  const dedupExpo = [];
  for (const row of expoDestinations) {
    if (seenTokens.has(row.token)) continue;
    seenTokens.add(row.token);
    dedupExpo.push(row);
  }

  return {
    expoDestinations: dedupExpo,
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

function localizedCopy(locale, type, payload, reporterName, actorName) {
  const he = locale === 'he';

  if (type === 'safety_check_started') {
    return {
      title: he ? 'בדיקת בטיחות הופעלה' : 'Safety Check Started',
      body: he ? `הופעל על ידי ${actorName}. הקש/י כדי לדווח סטטוס.` : `Triggered by ${actorName}. Tap to report your status now.`,
    };
  }

  if (type === 'safety_check_reminder') {
    return {
      title: he ? 'תזכורת: בדיקת בטיחות ממתינה' : 'Reminder: Safety Check Pending',
      body: he ? 'הקש/י ודווח/י סטטוס.' : 'Please tap and report your status.',
    };
  }

  if (type === 'safety_check_red_alert') {
    return {
      title: he ? '🚨 חבר צוות בסכנה' : '🚨 Teammate in danger',
      body: he ? `${reporterName} דיווח/ה לא בסדר.` : `${reporterName} reported NOT GREEN.`,
    };
  }

  if (payload.allSafe) {
    return {
      title: he ? 'בדיקת הבטיחות הסתיימה' : 'Safety Check Closed',
      body: he ? 'כל חברי הצוות בטוחים ✅' : 'All teammates are safe ✅',
    };
  }

  return {
    title: he ? 'בדיקת הבטיחות הסתיימה' : 'Safety Check Closed',
    body: payload.autoClosed
      ? (he ? 'כל חברי הצוות הגיבו. הבדיקה נסגרה.' : 'All teammates responded. Safety check closed.')
      : (he ? 'בדיקת הבטיחות נסגרה ידנית.' : 'Safety check was ended by a teammate.'),
  };
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
    destinations.map(async (dest) => {
      try {
        const payload = buildPayload(dest);
        await webpush.sendNotification(dest.subscription, JSON.stringify(payload));
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

  let members = await getTeamMemberIds(teamId);
  if (payload.excludeUid) members = members.filter((uid) => uid !== payload.excludeUid);
  const { expoDestinations, webSubscriptions } = await getDestinationsForUsers(members);

  let reporterName = 'A teammate';
  if (type === 'safety_check_red_alert' && payload.reportedByUid) {
    const userSnap = await db.collection('users').doc(String(payload.reportedByUid)).get();
    if (userSnap.exists) {
      const nm = userSnap.get('name');
      if (typeof nm === 'string' && nm.trim()) reporterName = nm.trim();
    }
  }

  let actorName = 'a teammate';
  if (createdBy && createdBy !== 'system:auto') {
    const actorSnap = await db.collection('users').doc(String(createdBy)).get();
    if (actorSnap.exists) {
      const nm = actorSnap.get('name');
      if (typeof nm === 'string' && nm.trim()) actorName = nm.trim();
    }
  }

  const expoMessages = expoDestinations.map(({ token, locale }) => {
    const copy = localizedCopy(locale, type, payload, reporterName, actorName);
    return {
      to: token,
      sound: 'default',
      title: copy.title,
      body: copy.body,
      data: { type, teamId, incidentId, ...payload }
    };
  });

  const [expoResult, webResult] = await Promise.all([
    sendExpo(expoMessages),
    sendWebPush(webSubscriptions, ({ uid, locale }) => {
      const copy = localizedCopy(locale, type, payload, reporterName, actorName);
      const isActionable = type === 'safety_check_started' || type === 'safety_check_reminder';
      const actionToken = isActionable ? signActionToken({
        uid,
        teamId,
        incidentId,
        exp: Date.now() + 1000 * 60 * 60 * 4,
      }) : '';

      return {
        title: copy.title,
        body: copy.body,
        data: {
          type,
          teamId,
          incidentId,
          ...payload,
          actionToken,
          actionUrl: WEB_PUSH_ACTION_URL,
        },
        actions: isActionable ? [
          { action: 'green', title: locale === 'he' ? '✅ בסדר' : '✅ Green' },
          { action: 'not_green', title: locale === 'he' ? '🟥 לא בסדר' : '🟥 Not Green' }
        ] : []
      };
    })
  ]);

  await snap.ref.update({
    status: 'processed',
    result: {
      expo: expoResult,
      web: webResult,
    },
    tokenCount: expoDestinations.length,
    webSubscriptionCount: webSubscriptions.length,
    processedAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
