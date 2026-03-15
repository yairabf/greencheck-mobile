import type { User } from 'firebase/auth';

export async function registerPushToken(_user: User): Promise<{ ok: true } | { ok: false; reason: string }> {
  // Production-safe default until server-side push sender is finalized.
  return { ok: false, reason: 'Client push registration disabled by policy.' };
}
