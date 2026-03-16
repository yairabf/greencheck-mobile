import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppContainer } from '../components/AppContainer';
import { StatusCard } from '../components/StatusCard';
import { colors, radius, spacing } from '../config/theme';
import { useAuth } from '../services/AuthProvider';
import { useProfile } from '../services/ProfileProvider';
import { usePush } from '../services/PushProvider';
import { changePassword } from '../services/auth';
import { useI18n } from '../i18n';

export function ProfileScreen() {
  const { user } = useAuth();
  const { profile, saveProfile, saveLocale } = useProfile();
  const { status: pushStatus, reason: pushReason, retry: retryPush } = usePush();
  const { locale, setLocale, t } = useI18n();
  const [name, setName] = useState(profile?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [busyPassword, setBusyPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => setName(profile?.name ?? ''), [profile?.name]);

  async function onSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setMsg(t('profile.nameTooShort'));
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await saveProfile(trimmed);
      setMsg(t('profile.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('profile.failedSave'));
    } finally {
      setBusy(false);
    }
  }

  async function onChangePassword() {
    const pwd = newPassword.trim();
    if (pwd.length < 6) {
      setMsg(t('profile.passwordTooShort'));
      return;
    }
    setBusyPassword(true);
    setMsg(null);
    try {
      await changePassword(pwd);
      setNewPassword('');
      setMsg(t('profile.passwordUpdated'));
    } catch (e: any) {
      const raw = String(e?.message ?? '');
      if (raw.includes('requires-recent-login')) {
        setMsg(t('profile.passwordChangeRequiresRelogin'));
      } else {
        setMsg(e instanceof Error ? e.message : t('profile.failedChangePassword'));
      }
    } finally {
      setBusyPassword(false);
    }
  }

  async function onChangeLanguage() {
    const newLocale = locale === 'en' ? 'he' : 'en';
    try {
      await setLocale(newLocale);
      await saveLocale(newLocale);
      const langLabel = newLocale === 'en' ? t('profile.english') : t('profile.hebrew');
      setMsg(t('profile.languageUpdated', { lang: langLabel }));
      if (newLocale === 'he' || locale === 'he') {
        setMsg((prev) => `${prev ?? ''} ${t('profile.directionHint')}`.trim());
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('profile.failedChangeLanguage'));
    }
  }

  return (
    <AppContainer>
      <Text style={styles.title}>{t('profile.title')}</Text>
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>{t('profile.email')}</Text>
        <TextInput
          style={[styles.input, styles.readonly]}
          editable={false}
          value={user?.email || ''}
          placeholder={t('profile.email')}
          placeholderTextColor={colors.muted}
        />
      </View>
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>{t('profile.name')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('profile.name')}
          placeholderTextColor={colors.muted}
        />
      </View>
      <AppButton label={busy ? t('common.loading') : t('common.save')} onPress={onSave} />

      <View style={styles.fieldWrap}>
        <Text style={styles.label}>{t('profile.newPassword')}</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t('profile.newPassword')}
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>
      <AppButton label={busyPassword ? t('common.loading') : t('profile.changePassword')} variant="secondary" onPress={onChangePassword} />
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      <View style={styles.divider} />
      
      <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
      <Text style={styles.currentLang}>
        {locale === 'en' ? t('profile.english') : t('profile.hebrew')}
      </Text>
      <AppButton 
        label={t('profile.changeLanguage')} 
        variant="secondary" 
        onPress={onChangeLanguage} 
      />

      <View style={styles.divider} />

      <StatusCard
        title={t('home.pushStatus')}
        subtitle={pushStatus === 'ok' ? t('home.pushRegistered') : pushReason ? t('home.push', { status: pushReason }) : t('home.push', { status: pushStatus })}
      />
      {pushStatus === 'error' ? (
        <AppButton label={t('home.retryPush')} variant="secondary" onPress={() => void retryPush()} />
      ) : null}
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  fieldWrap: { gap: 6 },
  label: { color: colors.muted, fontSize: 12 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  readonly: { opacity: 0.8 },
  msg: { color: colors.muted, fontSize: 13 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  currentLang: { color: colors.muted, fontSize: 14 },
});
