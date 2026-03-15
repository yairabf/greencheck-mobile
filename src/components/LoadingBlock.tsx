import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../config/theme';

export function LoadingBlock({ label = 'Loading...' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    color: colors.muted,
  },
});
