import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppButton } from '../components/AppButton';
import { AppContainer } from '../components/AppContainer';
import { LoadingBlock } from '../components/LoadingBlock';
import { EmptyState } from '../components/EmptyState';
import { AppBanner } from '../components/AppBanner';
import { colors } from '../config/theme';
import { useProfile } from '../services/ProfileProvider';
import { getTeamMetrics, type TeamMetrics } from '../services/observability';
import { useT } from '../i18n';

export function MetricsScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useProfile();
  const t = useT();
  const teamId = profile?.teamIds?.[0];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);

  async function load() {
    if (!teamId) {
      setMetrics(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getTeamMetrics(teamId);
      setMetrics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load metrics');
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
      <AppButton label={`← ${t('common.back')}`} variant="secondary" onPress={() => navigation.goBack()} />
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{t('metrics.title')}</Text>
      {loading ? <LoadingBlock label={t('common.loading')} /> : null}
      {error ? <AppBanner tone="error" text={error} /> : null}
      {!loading && !metrics ? <EmptyState title={t('metrics.title')} subtitle={t('team.yourTeam')} /> : null}

      {metrics ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.muted }}>{t('metrics.incidentsTriggered')}: {metrics.incidentCount}</Text>
          <Text style={{ color: colors.muted }}>{t('metrics.statusSubmissions')}: {metrics.statusSubmissions}</Text>
          <Text style={{ color: colors.muted }}>{t('metrics.remindersSent')}: {metrics.remindersSent}</Text>
          <Text style={{ color: colors.muted }}>{t('metrics.pushAttempts')}: {metrics.pushAttempts}</Text>
          <Text style={{ color: colors.muted }}>{t('metrics.closedAuto')}: {metrics.closeAuto}</Text>
          <Text style={{ color: colors.muted }}>{t('metrics.closedManual')}: {metrics.closeManual}</Text>
        </View>
      ) : null}
    </AppContainer>
  );
}
