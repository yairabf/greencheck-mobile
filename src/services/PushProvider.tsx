import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthProvider';
import { useProfile } from './ProfileProvider';
import * as Notifications from 'expo-notifications';
import { registerPushToken } from './push';
import { parseNotificationIntent, setPendingIntent } from './notificationIntent';
import { navigateSafe } from './nav';

type PushContextValue = {
  status: 'idle' | 'registering' | 'ok' | 'error';
  reason?: string;
  retry: () => Promise<void>;
};

const PushContext = createContext<PushContextValue | null>(null);

export function PushProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const { needsSetup } = useProfile();
  const [status, setStatus] = useState<PushContextValue['status']>('idle');
  const [reason, setReason] = useState<string | undefined>(undefined);

  async function run() {
    if (!user || needsSetup) return;
    setStatus('registering');
    setReason(undefined);
    try {
      const result = await registerPushToken(user);
      if (result.ok) {
        setStatus('ok');
      } else {
        setStatus('error');
        setReason(result.reason);
      }
    } catch (e) {
      setStatus('error');
      setReason(e instanceof Error ? e.message : 'Push registration failed.');
    }
  }

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, needsSetup]);


  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const intent = parseNotificationIntent(response.notification.request.content.data);
      if (!intent) return;
      setPendingIntent(intent);
      navigateSafe('Home');
    });

    void Notifications.getLastNotificationResponseAsync().then((last) => {
      if (!last) return;
      const intent = parseNotificationIntent(last.notification.request.content.data);
      if (!intent) return;
      setPendingIntent(intent);
      navigateSafe('Home');
    });

    return () => sub.remove();
  }, []);

  const value = useMemo(
    () => ({ status, reason, retry: run }),
    [status, reason],
  );

  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}

export function usePush() {
  const ctx = useContext(PushContext);
  if (!ctx) throw new Error('usePush must be used inside PushProvider');
  return ctx;
}
