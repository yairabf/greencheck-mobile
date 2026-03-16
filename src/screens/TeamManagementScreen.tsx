import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AppContainer } from '../components/AppContainer';
import { AppButton } from '../components/AppButton';
import { StatusCard } from '../components/StatusCard';
import { colors } from '../config/theme';
import { useAuth } from '../services/AuthProvider';
import { useProfile } from '../services/ProfileProvider';
import { getTeamMembers, type TeamMember } from '../services/teamMembers';
import { removeTeamMember } from '../services/teamAdmin';
import { useT } from '../i18n';

export function TeamManagementScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const t = useT();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyRemoveUid, setBusyRemoveUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const teamId = profile?.teamIds?.[0] ?? null;
  const isCreator = !!members.find((m) => m.uid === user?.uid)?.isCreator;

  async function loadMembers() {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const { members: list } = await getTeamMembers(teamId);
      setMembers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.failedAction'));
    } finally {
      setLoading(false);
    }
  }

  async function onRemove(uid: string) {
    if (!teamId || !user) return;
    setBusyRemoveUid(uid);
    setError(null);
    setMsg(null);
    try {
      await removeTeamMember(teamId, user.uid, uid);
      setMsg(t('team.removedMember'));
      await loadMembers();
    } catch (e: any) {
      const raw = String(e?.message || '');
      if (raw.includes('Only team creator')) setError(t('team.onlyCreatorCanRemove'));
      else if (raw.includes('Cannot remove team creator')) setError(t('team.cannotRemoveCreator'));
      else setError(e instanceof Error ? e.message : t('common.failedAction'));
    } finally {
      setBusyRemoveUid(null);
    }
  }

  useEffect(() => {
    void loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  if (!teamId) {
    return (
      <AppContainer>
        <Text style={{ color: colors.muted }}>{t('team.yourTeam')}</Text>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{t('team.adminTools')}</Text>
      <StatusCard title={t('team.manageMembers')} subtitle={t('team.selectMemberToRemove')} />
      {!isCreator ? <Text style={{ color: colors.danger }}>{t('team.onlyCreatorCanRemove')}</Text> : null}
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.muted }}>{msg}</Text> : null}

      <View style={{ gap: 10 }}>
        {members.map((m) => (
          <View key={m.uid} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{m.name || 'Unnamed'}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{m.phone || t('team.noPhone')}</Text>
            </View>
            {isCreator && m.uid !== user?.uid ? (
              <AppButton
                label={busyRemoveUid === m.uid ? t('common.loading') : '🗑️'}
                variant="danger"
                onPress={() => void onRemove(m.uid)}
              />
            ) : null}
          </View>
        ))}
      </View>

      <AppButton label={t('team.refreshTeam')} variant="secondary" onPress={() => void loadMembers()} />
    </AppContainer>
  );
}
