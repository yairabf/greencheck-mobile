import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useEffect, useState } from 'react';
import { HomeScreen } from '../screens/HomeScreen';
import { IncidentScreen } from '../screens/IncidentScreen';
import { TeamScreen } from '../screens/TeamScreen';
import { CreateTeamScreen } from '../screens/CreateTeamScreen';
import { JoinTeamScreen } from '../screens/JoinTeamScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TeamManagementScreen } from '../screens/TeamManagementScreen';
import { EquipmentScreen } from '../screens/EquipmentScreen';
import { colors } from '../config/theme';
import { useT } from '../i18n';
import { useAuth } from '../services/AuthProvider';
import { useProfile } from '../services/ProfileProvider';
import { getTeamMembers } from '../services/teamMembers';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const TeamStack = createNativeStackNavigator();

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

export function AppTabs() {
  const t = useT();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    void (async () => {
      const teamId = profile?.teamIds?.[0];
      if (!teamId || !user) {
        setIsAdmin(false);
        return;
      }
      try {
        const { members } = await getTeamMembers(teamId);
        const me = members.find((m) => m.uid === user.uid);
        setIsAdmin(!!me?.isAdmin);
      } catch {
        setIsAdmin(false);
      }
    })();
  }, [profile?.teamIds, user?.uid]);

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
          tabBarLabel: t('nav.home'),
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Team"
        component={TeamTabStack}
        options={{
          tabBarLabel: t('nav.team'),
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>👥</Text>,
        }}
      />
      <Tab.Screen
        name="Equipment"
        component={EquipmentScreen}
        options={{
          tabBarLabel: t('nav.equipment'),
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🎒</Text>,
        }}
      />
      {isAdmin ? (
        <Tab.Screen
          name="TeamManagement"
          component={TeamManagementScreen}
          options={{
            tabBarLabel: t('nav.teamManagement'),
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>🛠️</Text>,
          }}
        />
      ) : null}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('nav.profile'),
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
