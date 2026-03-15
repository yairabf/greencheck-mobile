import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../config/theme';
import { useT } from '../i18n';

export type RosterMember = {
  uid: string;
  name: string;
  phone: string;
  status: 'green' | 'not_green' | 'no_response';
  isYou?: boolean;
};

export function IncidentRoster({ members }: { members: RosterMember[] }) {
  const t = useT();
  if (members.length === 0) {
    return <Text style={styles.empty}>{t('home.noActiveCheck')}</Text>;
  }

  return (
    <View style={styles.wrap}>
      {members.map((m) => (
        <View key={m.uid} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {m.name} {m.isYou ? `(${t('common.you')})` : ''}
            </Text>
            <Text style={styles.phone}>{m.phone || 'No phone'}</Text>
          </View>
          <Text style={[styles.badge, badgeStyle(m.status)]}>{label(m.status)}</Text>
        </View>
      ))}
    </View>
  );
}

function label(s: RosterMember['status']) {
  if (s === 'green') return 'GREEN';
  if (s === 'not_green') return 'NOT GREEN';
  return 'NO RESPONSE';
}

function badgeStyle(s: RosterMember['status']) {
  if (s === 'green') return { backgroundColor: '#1B5E20' };
  if (s === 'not_green') return { backgroundColor: '#B71C1C' };
  return { backgroundColor: '#455A64' };
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: { color: colors.text, fontWeight: '700' },
  phone: { color: colors.muted, fontSize: 12 },
  badge: {
    color: '#fff',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: 11,
    overflow: 'hidden',
  },
  empty: { color: colors.muted },
});
