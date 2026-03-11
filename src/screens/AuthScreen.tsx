import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppContainer } from '../components/AppContainer';
import { colors, radius, spacing } from '../config/theme';
import { AppBanner } from '../components/AppBanner';
import { useAuth } from '../services/AuthProvider';

export function AuthScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { sendOtp, verifyOtp, confirmation } = useAuth();

  async function onSendOtp() {
    setError(null);
    setBusy(true);
    try {
      await sendOtp(phone.trim(), undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp() {
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(code.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to verify OTP');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppContainer>
      <View style={styles.wrap}>
        <Text style={styles.title}>GreenCheck</Text>
        <Text style={styles.sub}>Sign in with phone to join your team.</Text>
      </View>

      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        placeholder="+1 555 123 4567"
        placeholderTextColor={colors.muted}
        value={phone}
        onChangeText={setPhone}
      />

      {!confirmation ? (
        <AppButton label={busy ? 'Sending...' : 'Send OTP'} onPress={onSendOtp} />
      ) : (
        <>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Enter OTP code"
            placeholderTextColor={colors.muted}
            value={code}
            onChangeText={setCode}
          />
          <AppButton label={busy ? 'Verifying...' : 'Verify OTP'} onPress={onVerifyOtp} />
        </>
      )}

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
});
