export type NotificationIntent = {
  type: string;
  teamId?: string;
  incidentId?: string;
};

let pendingIntent: NotificationIntent | null = null;

export function parseNotificationIntent(raw: unknown): NotificationIntent | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const type = typeof obj.type === 'string' ? obj.type : '';
  if (!type) return null;
  return {
    type,
    teamId: typeof obj.teamId === 'string' ? obj.teamId : undefined,
    incidentId: typeof obj.incidentId === 'string' ? obj.incidentId : undefined,
  };
}

export function setPendingIntent(intent: NotificationIntent | null) {
  pendingIntent = intent;
}

export function consumePendingIntent(): NotificationIntent | null {
  const i = pendingIntent;
  pendingIntent = null;
  return i;
}
