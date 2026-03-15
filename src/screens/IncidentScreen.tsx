import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppButton } from '../components/AppButton';
import { AppContainer } from '../components/AppContainer';
import { StatusCard } from '../components/StatusCard';
import { colors } from '../config/theme';
import { useT } from '../i18n';

export function IncidentScreen() {
  const navigation = useNavigation<any>();
  const t = useT();
  return (
    <AppContainer>
      <AppButton label={`← ${t('common.back')}`} variant="secondary" onPress={() => navigation.goBack()} />
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{t('incident.title')}</Text>
      <StatusCard
        title={t('incident.status')}
        subtitle={t('incident.details')}
      />
    </AppContainer>
  );
}
