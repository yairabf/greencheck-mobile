export type WebNotificationAction = {
  action: 'green' | 'not_green' | 'open' | string;
  teamId?: string;
  incidentId?: string;
};

export function consumeWebNotificationAction(): WebNotificationAction | null {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  const action = url.searchParams.get('notifAction');
  if (!action) return null;

  const out: WebNotificationAction = {
    action,
    teamId: url.searchParams.get('teamId') || undefined,
    incidentId: url.searchParams.get('incidentId') || undefined,
  };

  url.searchParams.delete('notifAction');
  url.searchParams.delete('teamId');
  url.searchParams.delete('incidentId');
  window.history.replaceState({}, '', url.toString());

  return out;
}
