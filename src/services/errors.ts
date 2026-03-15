import { IncidentError } from './incident';

export function humanizeError(e: unknown, fallback = 'Something went wrong.'): string {
  if (e instanceof IncidentError) {
    if (e.code === 'INCIDENT_ALREADY_ACTIVE') return 'A safety check is already active.';
    if (e.code === 'INCIDENT_STALE') return 'This incident is no longer active. Please refresh.';
    if (e.code === 'INCIDENT_NOT_ACTIVE') return 'This incident is already closed.';
  }
  if (e instanceof Error) {
    const msg = e.message || fallback;
    if (/permission/i.test(msg)) return 'Permission denied for this action.';
    if (/network/i.test(msg)) return 'Network error. Please try again.';
    return msg;
  }
  return fallback;
}
