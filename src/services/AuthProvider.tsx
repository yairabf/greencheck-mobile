import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { ConfirmationResult, User } from 'firebase/auth';
import { confirmOtp, listenAuthState, logout, requestOtp } from './auth';
import { hasFirebaseEnv } from '../config/env';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  confirmation: ConfirmationResult | null;
  sendOtp: (phoneNumber: string, appVerifier?: unknown) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  enabled: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!hasFirebaseEnv) {
      setLoading(false);
      return;
    }

    const unsub = listenAuthState((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsub;
  }, []);

  async function sendOtp(phoneNumber: string, appVerifier?: unknown) {
    if (!hasFirebaseEnv) throw new Error('Firebase is not configured.');
    const next = await requestOtp(phoneNumber, appVerifier);
    setConfirmation(next);
  }

  async function verifyOtp(code: string) {
    if (!confirmation) throw new Error('Request OTP first.');
    await confirmOtp(confirmation, code);
    setConfirmation(null);
  }

  async function signOut() {
    if (!hasFirebaseEnv) return;
    await logout();
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, confirmation, sendOtp, verifyOtp, signOut, enabled: hasFirebaseEnv }),
    [user, loading, confirmation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
