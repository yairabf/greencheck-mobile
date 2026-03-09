import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen } from '../screens/AuthScreen';

const Stack = createNativeStackNavigator();

export function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
}
