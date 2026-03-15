import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../config/theme';

type Props = {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onPress?: () => void;
};

export function AppButton({ label, variant = 'primary', onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, variant === 'secondary' && styles.secondary, variant === 'danger' && styles.danger]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  text: {
    color: colors.text,
    fontWeight: '700',
  },
});
