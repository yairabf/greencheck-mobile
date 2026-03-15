import { NavigationContainer } from '@react-navigation/native';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';
import { AuthProvider, useAuth } from '../services/AuthProvider';
import { ProfileProvider } from '../services/ProfileProvider';

function RootFlow() {
  const { user, loading, enabled } = useAuth();

  if (!enabled) {
    return <AuthStack />;
  }

  if (loading) {
    return <AuthStack />;
  }

  return user ? <AppStack /> : <AuthStack />;
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <ProfileProvider>
          <RootFlow />
        </ProfileProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}
