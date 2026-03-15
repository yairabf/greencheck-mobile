import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppContainer } from '../components/AppContainer';
import { colors, radius, spacing } from '../config/theme';
import { useAuth } from '../services/AuthProvider';
import { useProfile } from '../services/ProfileProvider';
import { useI18n } from '../i18n';

export function ProfileScreen() {
  const { user } = useAuth();
  const { profile, saveProfile, saveLocale } = useProfile();
  const { locale, setLocale, t } = useI18n();
  const [name, setName] = useState(profile?.name ?? '');
  const [busy, setBusy] = useState(false);
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
