import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { IncidentScreen } from '../screens/IncidentScreen';
import { TeamScreen } from '../screens/TeamScreen';
import { CreateTeamScreen } from '../screens/CreateTeamScreen';
import { JoinTeamScreen } from '../screens/JoinTeamScreen';
import { IncidentHistoryScreen } from '../screens/IncidentHistoryScreen';
import { MetricsScreen } from '../screens/MetricsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../config/theme';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const TeamStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();

function HomeTabStack() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Home' }} />
      <HomeStack.Screen name="Incident" component={IncidentScreen} />
    </HomeStack.Navigator>
  );
}

function TeamTabStack() {
  return (
    <TeamStack.Navigator>
      <TeamStack.Screen name="TeamMain" component={TeamScreen} options={{ title: 'Team' }} />
      <TeamStack.Screen name="CreateTeam" component={CreateTeamScreen} options={{ title: 'Create Team' }} />
      <TeamStack.Screen name="JoinTeam" component={JoinTeamScreen} options={{ title: 'Join Team' }} />
    </TeamStack.Navigator>
  );
}

function HistoryTabStack() {
  return (
    <HistoryStack.Navigator>
      <HistoryStack.Screen name="IncidentHistory" component={IncidentHistoryScreen} options={{ title: 'History' }} />
      <HistoryStack.Screen name="Metrics" component={MetricsScreen} />
    </HistoryStack.Navigator>
  );
}

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeTabStack}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Team"
        component={TeamTabStack}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryTabStack}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
