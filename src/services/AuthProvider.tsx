import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { User } from 'firebase/auth';
import { listenAuthState, logout, signInWithEmail, signUpWithEmail } from './auth';
import { hasFirebaseEnv } from '../config/env';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  authReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  enabled: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function signIn(email: string, password: string) {
    if (!hasFirebaseEnv) throw new Error('Firebase is not configured.');
    await signInWithEmail(email, password);
  }

  async function signUp(email: string, password: string) {
    if (!hasFirebaseEnv) throw new Error('Firebase is not configured.');
    await signUpWithEmail(email, password);
  }

  async function signOutUser() {
    if (!hasFirebaseEnv) return;
    await logout();
  }

  const value = useMemo<AuthContextValue>(
    () => ({ 
      user, 
      loading, 
      authReady: !loading,
      signIn, 
      signUp, 
      signOutUser, 
      enabled: hasFirebaseEnv 
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
