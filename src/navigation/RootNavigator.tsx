import { NavigationContainer } from '@react-navigation/native';
import { AppTabs } from './AppTabs';
import { AuthStack } from './AuthStack';
import { useAuth } from '../services/AuthProvider';
import { navigationRef } from '../services/nav';

function RootFlow() {
  const { user, loading, enabled } = useAuth();

  if (!enabled) {
    return <AuthStack />;
  }

  if (loading) {
    return <AuthStack />;
  }

  return user ? <AppTabs /> : <AuthStack />;
}

export function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <RootFlow />
    </NavigationContainer>
  );
}
