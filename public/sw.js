self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'GreenCheck', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'GreenCheck';
  const options = {
    body: data.body || 'New safety update',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.data || {},
    actions: Array.isArray(data.actions) ? data.actions : [
      { action: 'green', title: '✅ Green' },
      { action: 'not_green', title: '🟥 Not Green' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const teamId = data.teamId ? `&teamId=${encodeURIComponent(data.teamId)}` : '';
  const incidentId = data.incidentId ? `&incidentId=${encodeURIComponent(data.incidentId)}` : '';
  const action = event.action || 'open';
  const targetUrl = `/?notifAction=${encodeURIComponent(action)}${teamId}${incidentId}`;

  async function openApp() {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if ('focus' in client) {
        client.navigate(targetUrl);
        return client.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    return undefined;
  }

  event.waitUntil((async () => {
    if ((action === 'green' || action === 'not_green') && data.actionUrl && data.actionToken) {
      try {
        const u = `${data.actionUrl}?token=${encodeURIComponent(data.actionToken)}&action=${encodeURIComponent(action)}`;
        const res = await fetch(u, { method: 'POST', mode: 'cors' });
        if (res.ok) {
          await self.registration.showNotification('GreenCheck', {
            body: action === 'green' ? 'Reported: Green ✅' : 'Reported: Not Green 🟥',
            icon: '/favicon.ico',
          });
          return;
        }
      } catch {
        // fall through to open-app flow
      }
    }

    await openApp();
  })());
});
