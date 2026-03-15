import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppContainer } from '../components/AppContainer';
import { colors, radius, spacing } from '../config/theme';
import { LoadingBlock } from '../components/LoadingBlock';
import { EmptyState } from '../components/EmptyState';
import { AppBanner } from '../components/AppBanner';
import { listIncidents } from '../services/incident';
import { useProfile } from '../services/ProfileProvider';
import type { Incident } from '../types/incident';
import { useT } from '../i18n';

function formatTs(ts: unknown): string {
  if (!ts) return '—';
  const anyTs = ts as any;
  if (typeof anyTs?.toDate === 'function') {
    const d = anyTs.toDate() as Date;
    return d.toLocaleString();
  }
  return String(ts);
}

export function IncidentHistoryScreen() {
  const { profile } = useProfile();
  const t = useT();
  const teamId = profile?.teamIds?.[0];
  const [rows, setRows] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    if (!teamId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listIncidents(teamId);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  return (
    <AppContainer>
      <Text style={styles.title}>{t('history.title')}</Text>
      {loading ? <LoadingBlock label={t('common.loading')} /> : null}
      {error ? <AppBanner tone="error" text={error} /> : null}
      {!loading && rows.length === 0 ? <EmptyState title={t('history.noIncidents')} subtitle={t('home.triggerCheck')} /> : null}

      <View style={{ gap: spacing.sm }}>
        {rows.map((r) => {
          const isOpen = expanded === r.id;
          return (
            <Pressable
              key={r.id}
              style={styles.card}
              onPress={() => setExpanded(isOpen ? null : r.id)}
            >
              <Text style={styles.id}>#{r.id.slice(0, 8)} • {r.status.toUpperCase()}</Text>
              <Text style={styles.meta}>Triggered: {formatTs(r.triggeredAt)}</Text>
              {isOpen ? (
                <View style={{ gap: 4 }}>
                  <Text style={styles.meta}>Ended: {formatTs(r.endedAt)}</Text>
                  <Text style={styles.meta}>Close mode: {r.autoClosed ? 'Auto' : 'Manual'}</Text>
                  <Text style={styles.meta}>Ended by: {r.endedBy ?? '—'}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  id: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12 },
});
