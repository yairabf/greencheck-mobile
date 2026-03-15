import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../config/theme';

type Props = {
  name: string;
  phone: string;
  isCreator?: boolean;
  isYou?: boolean;
};

export function MemberRow({ name, phone, isCreator, isYou }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>
          {name} {isYou ? '(You)' : ''}
        </Text>
        <Text style={styles.phone}>{phone || 'No phone'}</Text>
      </View>
      {isCreator ? <Text style={styles.badge}>Creator</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: { color: colors.text, fontWeight: '700' },
  phone: { color: colors.muted, fontSize: 12 },
  badge: {
    color: colors.text,
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: 11,
    overflow: 'hidden',
  },
});
