import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppContainer } from '../components/AppContainer';
import { colors, radius, spacing } from '../config/theme';
import { useAuth } from '../services/AuthProvider';
import { useProfile } from '../services/ProfileProvider';
import { joinTeamWithCode } from '../services/invite';
import { useT } from '../i18n';

export function JoinTeamScreen() {
  const { user } = useAuth();
  const { refresh } = useProfile();
  const t = useT();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onJoin() {
    if (!user) return;
    const normalized = code.trim().toUpperCase();
    if (normalized.length < 4) {
      setMsg('Enter a valid invite code.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const teamId = await joinTeamWithCode(user.uid, normalized);
      await refresh();
      setMsg(`Joined team: ${teamId}`);
      setCode('');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to join team');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppContainer>
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('joinTeam.title')}</Text>
        <Text style={styles.sub}>{t('joinTeam.inviteCode')}</Text>
      </View>
      <TextInput
        style={styles.input}
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
        placeholder="ABC123"
        placeholderTextColor={colors.muted}
      />
      <AppButton label={busy ? t('joinTeam.joining') : t('joinTeam.join')} onPress={onJoin} />
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
