import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppButton } from '../components/AppButton';
import { AppContainer } from '../components/AppContainer';
import { MemberRow } from '../components/MemberRow';
import { StatusCard } from '../components/StatusCard';
import { colors } from '../config/theme';
import { useAuth } from '../services/AuthProvider';
import { createTeamInvite } from '../services/invite';
import { useProfile } from '../services/ProfileProvider';
import { getTeamMembers, setMyTeamActiveState, type TeamMember } from '../services/teamMembers';
import { leaveTeam } from '../services/teamAdmin';import { useT } from '../i18n';

export function TeamScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const t = useT();
  const [invite, setInvite] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [teamName, setTeamName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busyAvailability, setBusyAvailability] = useState(false);
  const [busyLeave, setBusyLeave] = useState(false);
  const [membersView, setMembersView] = useState<'active' | 'inactive'>('active');
  const [msg, setMsg] = useState<string | null>(null);

  async function onGenerateInvite() {
    if (!user || !profile?.teamIds?.length) return;
    setBusy(true);
    try {
      const code = await createTeamInvite(profile.teamIds[0], user.uid);
      setInvite(code);
    } finally {
      setBusy(false);
    }
  }

  async function onToggleMyAvailability() {
    if (!user || !profile?.teamIds?.length) return;
    const me = members.find((m) => m.uid === user.uid);
    const nextActive = !(me?.active ?? true);
    setBusyAvailability(true);
    try {
      await setMyTeamActiveState(profile.teamIds[0], user.uid, nextActive);
      await loadMembers();
    } finally {
      setBusyAvailability(false);
    }
  }

  async function onLeaveTeam() {
    if (!user || !profile?.teamIds?.length) return;
    setBusyLeave(true);
    setError(null);
    setMsg(null);
    try {
      await leaveTeam(profile.teamIds[0], user.uid);
      setMsg(t('team.leftTeam'));
      await loadMembers();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.failedAction'));
    } finally {
      setBusyLeave(false);
    }
  }

  async function loadMembers() {
    if (!profile?.teamIds?.length) return;
    setLoadingMembers(true);
    setError(null);
    try {
      const { team, members: list } = await getTeamMembers(profile.teamIds[0]);
      setMembers(list);
      setTeamName(team?.name ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('team.failedLoadMembers'));
    } finally {
      setLoadingMembers(false);
    }
  }

  useEffect(() => {
    void loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.teamIds?.[0]]);

  return (
    <AppContainer>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{t('team.title')}</Text>
      <StatusCard
        title={t('team.members')}
        subtitle={teamName ? `${teamName} • ${t('team.activeSummary', { active: members.filter((m) => m.active).length, total: members.length })}` : t('team.yourTeam')}
      />
      <Text style={{ color: colors.muted, fontSize: 13 }}>{t('home.teammates')}</Text>
      <AppButton
        label={busyAvailability ? t('common.loading') : ((members.find((m) => m.uid === user?.uid)?.active ?? true) ? t('team.setMeInactive') : t('team.setMeActive'))}
        variant="secondary"
        onPress={() => void onToggleMyAvailability()}
      />

      {loadingMembers ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.muted }}>{msg}</Text> : null}

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <AppButton
            label={`${t('team.filterActive')} (${members.filter((m) => m.active).length})`}
            variant={membersView === 'active' ? 'primary' : 'secondary'}
            onPress={() => setMembersView('active')}
          />
          <AppButton
            label={`${t('team.filterInactive')} (${members.filter((m) => !m.active).length})`}
            variant={membersView === 'inactive' ? 'primary' : 'secondary'}
            onPress={() => setMembersView('inactive')}
          />
        </View>

        {membersView === 'active' ? (
          members.filter((m) => m.active).length === 0 ? (
            <Text style={{ color: colors.muted }}>{t('team.noActiveTeammates')}</Text>
          ) : members.filter((m) => m.active).map((m) => (
            <MemberRow
              key={`active-${m.uid}`}
              name={m.name}
              phone={m.phone}
              isCreator={m.isCreator}
              isAdmin={m.isAdmin}
              isYou={m.uid === user?.uid}
              active={m.active}
            />
          ))
        ) : (
          members.filter((m) => !m.active).length === 0 ? (
            <Text style={{ color: colors.muted }}>{t('team.noInactiveTeammates')}</Text>
          ) : members.filter((m) => !m.active).map((m) => (
            <MemberRow
              key={`inactive-${m.uid}`}
              name={m.name}
              phone={m.phone}
              isCreator={m.isCreator}
              isAdmin={m.isAdmin}
              isYou={m.uid === user?.uid}
              active={m.active}
            />
          ))
        )}
      </View>

      {!loadingMembers && members.length === 0 ? (
        <Text style={{ color: colors.muted }}>{t('team.yourTeam')}</Text>
      ) : null}

      <View style={{ gap: 10 }}>
        <AppButton
          label={t('home.createTeam')}
          variant="secondary"
          onPress={() => navigation.navigate('CreateTeam')}
        />
        <AppButton
          label={t('home.joinTeam')}
          variant="secondary"
          onPress={() => navigation.navigate('JoinTeam')}
        />
        <AppButton
          label={busy ? t('common.loading') : t('team.inviteMember')}
          variant="secondary"
          onPress={() => void onGenerateInvite()}
        />
        {invite ? <Text style={{ color: colors.text }}>{t('joinTeam.inviteCode')}: {invite}</Text> : null}
        <AppButton label={t('team.refreshTeam')} variant="secondary" onPress={() => void loadMembers()} />
        <AppButton
          label={busyLeave ? t('common.loading') : t('team.leaveTeamAction')}
          variant="danger"
          onPress={() => void onLeaveTeam()}
        />
      </View>
    </AppContainer>
  );
}
