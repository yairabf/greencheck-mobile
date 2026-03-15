import { Text } from 'react-native';
import { AppContainer } from '../components/AppContainer';
import { StatusCard } from '../components/StatusCard';
import { colors } from '../config/theme';
import { useT } from '../i18n';

export function IncidentScreen() {
  const t = useT();
  return (
    <AppContainer>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{t('incident.title')}</Text>
      <StatusCard
        title={t('incident.status')}
        subtitle={t('incident.details')}
      />
    </AppContainer>
  );
}
