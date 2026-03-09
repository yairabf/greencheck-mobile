import { NavigationContainer } from '@react-navigation/native';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';

const isAuthenticated = false;

export function RootNavigator() {
  return <NavigationContainer>{isAuthenticated ? <AppStack /> : <AuthStack />}</NavigationContainer>;
}
