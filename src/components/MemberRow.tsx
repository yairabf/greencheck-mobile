import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../config/theme';
import { useT } from '../i18n';

type Props = {
  name: string;
  phone: string;
  isCreator?: boolean;
  isYou?: boolean;
  active?: boolean;
};

export function MemberRow({ name, phone, isCreator, isYou, active = true }: Props) {
  const t = useT();

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>
          {name} {isYou ? '(You)' : ''}
        </Text>
        <Text style={styles.phone}>{phone || t('team.noPhone')}</Text>
      </View>
      <Text style={[styles.badge, active ? styles.activeBadge : styles.inactiveBadge]}>{active ? t('team.statusActive') : t('team.statusInactive')}</Text>
      {isCreator ? <Text style={styles.badge}>{t('team.creator')}</Text> : null}
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
  activeBadge: {
    backgroundColor: '#1f5f2a',
  },
  inactiveBadge: {
    backgroundColor: '#5f2a2a',
  },
});
