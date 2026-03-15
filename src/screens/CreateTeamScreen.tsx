import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppContainer } from '../components/AppContainer';
import { colors, radius, spacing } from '../config/theme';
import { useAuth } from '../services/AuthProvider';
import { createTeamForUser } from '../services/team';
import { useProfile } from '../services/ProfileProvider';
import { useT } from '../i18n';

export function CreateTeamScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { refresh } = useProfile();
  const t = useT();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onCreate() {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setMsg('Team name must be at least 3 characters.');
      return;
    }
    if (!user) {
      setMsg('You must be signed in.');
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const id = await createTeamForUser(user.uid, trimmed);
      await refresh();
      setMsg(`Team created: ${id}`);
      setName('');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to create team');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppContainer>
      <AppButton label={`← ${t('common.back')}`} variant="secondary" onPress={() => navigation.goBack()} />
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('createTeam.title')}</Text>
        <Text style={styles.sub}>{t('team.yourTeam')}</Text>
      </View>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t('createTeam.teamName')}
        placeholderTextColor={colors.muted}
      />

      <AppButton label={busy ? t('createTeam.creating') : t('createTeam.create')} onPress={onCreate} />
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 14 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  msg: { color: colors.muted, fontSize: 13 },
});
