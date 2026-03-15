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
import { getTeamMembers, type TeamMember } from '../services/teamMembers';
import { useT } from '../i18n';

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

  async function loadMembers() {
    if (!profile?.teamIds?.length) return;
    setLoadingMembers(true);
    setError(null);
    try {
      const { team, members: list } = await getTeamMembers(profile.teamIds[0]);
      setMembers(list);
      setTeamName(team?.name ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load members');
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
        subtitle={teamName ? `${teamName} • ${members.length}` : t('team.yourTeam')}
      />
      <Text style={{ color: colors.muted, fontSize: 13 }}>Teammates</Text>

      {loadingMembers ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

      <View style={{ gap: 10 }}>
        {members.map((m) => (
          <MemberRow
            key={m.uid}
            name={m.name}
            phone={m.phone}
            isCreator={m.isCreator}
            isYou={m.uid === user?.uid}
          />
        ))}
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
        <AppButton label="Refresh team" variant="secondary" onPress={() => void loadMembers()} />
      </View>
    </AppContainer>
  );
}
