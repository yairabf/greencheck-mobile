import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppContainer } from '../components/AppContainer';
import { colors, radius, spacing } from '../config/theme';
import { AppBanner } from '../components/AppBanner';
import { useAuth } from '../services/AuthProvider';
import { useT } from '../i18n';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();
  const t = useT();

  async function onSubmit() {
    setError(null);
    setBusy(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (e: any) {
      const message = e?.message || 'Authentication failed';
      setError(message.replace('Firebase: ', '').replace(/\(auth\/[^)]+\)/, '').trim());
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppContainer>
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('auth.title')}</Text>
        <Text style={styles.sub}>{isSignUp ? t('auth.signUp') : t('auth.signIn')}</Text>
      </View>

      <TextInput
        style={styles.input}
        keyboardType="email-address"
        placeholder={t('auth.email')}
        placeholderTextColor={colors.muted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder={t('auth.password')}
        placeholderTextColor={colors.muted}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
      />

      <AppButton 
        label={busy ? t('common.loading') : (isSignUp ? t('auth.signUpButton') : t('auth.signInButton'))} 
        onPress={onSubmit} 
      />

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchButton}>
        <Text style={styles.switchText}>
          {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.noAccount')}
        </Text>
      </TouchableOpacity>

      {error ? <AppBanner tone="error" text={error} /> : null}
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
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
  switchButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  switchText: {
    color: colors.muted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
