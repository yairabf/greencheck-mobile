import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
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

const subPageOptions = {
  headerBackVisible: true,
  headerBackTitle: 'Back',
  headerBackTitleVisible: true,
  headerTintColor: colors.text,
  headerStyle: {
    backgroundColor: colors.bg,
  },
  headerShadowVisible: true,
};

function HomeTabStack() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.bg },
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Home' }} />
      <HomeStack.Screen
        name="Incident"
        component={IncidentScreen}
        options={{
          title: 'Safety Check',
          ...subPageOptions,
        }}
      />
    </HomeStack.Navigator>
  );
}

function TeamTabStack() {
  return (
    <TeamStack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.bg },
      }}
    >
      <TeamStack.Screen name="TeamMain" component={TeamScreen} options={{ title: 'Team' }} />
      <TeamStack.Screen
        name="CreateTeam"
        component={CreateTeamScreen}
        options={{
          title: 'Create Team',
          ...subPageOptions,
        }}
      />
      <TeamStack.Screen
        name="JoinTeam"
        component={JoinTeamScreen}
        options={{
          title: 'Join Team',
          ...subPageOptions,
        }}
      />
    </TeamStack.Navigator>
  );
}

function HistoryTabStack() {
  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.bg },
      }}
    >
      <HistoryStack.Screen name="IncidentHistory" component={IncidentHistoryScreen} options={{ title: 'History' }} />
      <HistoryStack.Screen
        name="Metrics"
        component={MetricsScreen}
        options={{
          title: 'Metrics',
          ...subPageOptions,
        }}
      />
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
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 78,
          paddingTop: 8,
          paddingBottom: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeTabStack}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Team"
        component={TeamTabStack}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>👥</Text>,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryTabStack}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🕒</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
