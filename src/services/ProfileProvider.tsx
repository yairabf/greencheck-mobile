import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useAuth } from './AuthProvider';
import type { UserProfile } from '../types/profile';
import { createUserProfile, getUserProfile, updateUserLocale, updateUserProfile } from './profile';

type ProfileContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  needsSetup: boolean;
  refresh: () => Promise<void>;
  completeSetup: (name: string) => Promise<void>;
  saveProfile: (name: string) => Promise<void>;
  saveLocale: (locale: 'en' | 'he') => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!user) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      const next = await getUserProfile(user.uid);
      setProfile(next);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      needsSetup: !!user && (!profile || !profile.name?.trim()),
      refresh,
      completeSetup: async (name: string) => {
        if (!user) throw new Error('Not authenticated');
        await createUserProfile(user, name);
        await refresh();
      },
      saveProfile: async (name: string) => {
        if (!user) throw new Error('Not authenticated');
        await updateUserProfile(user.uid, { name });
        await refresh();
      },
      saveLocale: async (locale: 'en' | 'he') => {
        if (!user) throw new Error('Not authenticated');
        await updateUserLocale(user.uid, locale);
        await refresh();
      },
    }),
    [profile, loading, user],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
