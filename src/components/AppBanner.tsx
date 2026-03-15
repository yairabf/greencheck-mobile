import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../config/theme';

type Props = {
  tone?: 'info' | 'success' | 'error';
  text: string;
};

export function AppBanner({ tone = 'info', text }: Props) {
  return (
    <View style={[styles.base, tone === 'success' && styles.success, tone === 'error' && styles.error]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  success: {
    backgroundColor: '#1B5E20',
    borderColor: '#2E7D32',
  },
  error: {
    backgroundColor: '#B71C1C',
    borderColor: '#D32F2F',
  },
  text: {
    color: colors.text,
    fontSize: 13,
  },
});
