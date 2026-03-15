import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppContainer } from '../components/AppContainer';
import { colors, radius, spacing } from '../config/theme';
import { useAuth } from '../services/AuthProvider';
import { useProfile } from '../services/ProfileProvider';
import { useI18n } from '../i18n';

export function ProfileScreen() {
  const { user } = useAuth();
  const { profile, saveProfile } = useProfile();
  const { locale, setLocale, t } = useI18n();
  const [name, setName] = useState(profile?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => setName(profile?.name ?? ''), [profile?.name]);

  async function onSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setMsg('Name must be at least 2 characters.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await saveProfile(trimmed);
      setMsg('Saved.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setBusy(false);
    }
  }

  async function onChangeLanguage() {
    const newLocale = locale === 'en' ? 'he' : 'en';

    Alert.alert(
      t('profile.changeLanguage'),
      `${t('profile.language')}: ${newLocale === 'en' ? t('profile.english') : t('profile.hebrew')}`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await setLocale(newLocale);
              setMsg(`Language updated to ${newLocale === 'en' ? 'English' : 'Hebrew'}.`);
              if (newLocale === 'he' || locale === 'he') {
                Alert.alert('Direction update', 'If layout direction looks wrong, fully close and reopen the app.');
              }
            } catch (e) {
              setMsg(e instanceof Error ? e.message : 'Failed to change language');
            }
          },
        },
      ]
    );
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
