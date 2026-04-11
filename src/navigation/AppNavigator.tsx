import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import {
  HomeIcon,
  Telescope,
  TicketCheck,
  LucideMessageSquareWarning,
} from 'lucide-react-native';

// Screens — adjust import paths to match your project
import Landing               from '@/landing';
import WelcomeScreen         from '@/Splash';
import LoginScreen           from '@/Auth/login';
import AgentHome             from '@/Pages/AgentHome';
import DiscoverScreen        from '@/Pages/Discoverandincidentpages';
import IncidentScreen        from '@/Pages/IncidentScreen';
import JourneyManagementScreen from '@/Pages/DriverJourney';

// Auth
import { AuthProvider, useAuth, ROLE_CONFIG, UserRole } from '../contexts/authContext'; 

// ── Stack & Tab navigators ────────────────────────────────────────────────────
const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Design tokens ─────────────────────────────────────────────────────────────
const BLUE = '#003DD0';

// ── Tab item component ────────────────────────────────────────────────────────
function TabItem({
  icon: Icon,
  label,
  focused,
  activeColor,
}: {
  icon: any;
  label: string;
  focused: boolean;
  activeColor: string;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 14,
        width: 90,
        borderRadius: 15,
        backgroundColor: focused ? `${activeColor}18` : 'transparent',
      }}
    >
      <Icon size={22} color={focused ? activeColor : '#9CA3AF'} />
      <StatusBar style="light" />
      <View style={{ marginTop: 4 }}>
        <View>
          {/* Using Text via react-native — no className available without NativeWind setup */}
        </View>
      </View>
    </View>
  );
}

// ── Role-gated bottom tabs ────────────────────────────────────────────────────
// Each role has a `tabs` array in ROLE_CONFIG — only registered tabs render.
// Unregistered screens are never mounted, preventing unauthorized access.
function RoleBasedTabs() {
  const { user } = useAuth();

  if (!user) return null;

  const roleConfig  = ROLE_CONFIG[user.role];
  const activeColor = roleConfig?.color ?? BLUE;
  const allowedTabs = roleConfig?.tabs ?? [];

  const showTab = (name: string) => allowedTabs.includes(name as any);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:      false,
        tabBarShowLabel:  true,
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '600',
          marginTop:  2,
        },
        tabBarActiveTintColor:   activeColor,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height:          70,
          paddingTop:      6,
          paddingBottom:   10,
          borderTopWidth:  0,
          elevation:       12,
          shadowColor:     '#000',
          shadowOpacity:   0.08,
          shadowRadius:    10,
          shadowOffset:    { width: 0, height: -4 },
        },
      }}
    >
      {/* Home — visible to all roles */}
      {showTab('Homescreen') && (
        <Tab.Screen
          name="Homescreen"
          component={AgentHome}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <HomeIcon size={22} color={focused ? activeColor : '#9CA3AF'} />
            ),
          }}
        />
      )}

      {/* Discover — parent, nesa_admin, school_admin, system_admin */}
      {showTab('Discover') && (
        <Tab.Screen
          name="Discover"
          component={(props:any) => <DiscoverScreen {...props} />}
          options={{
            tabBarLabel: 'Discover',
            tabBarIcon: ({ color, focused }) => (
              <Telescope size={22} color={focused ? activeColor : '#9CA3AF'} />
            ),
          }}
        />
      )}

      {/* Ticket / Journey — driver, pickup_agent, agency_admin */}
      {showTab('Ticketverify') && (
        <Tab.Screen
          name="Ticketverify"
          component={JourneyManagementScreen}
          options={{
            tabBarLabel: 'Journeys',
            tabBarIcon: ({ color, focused }) => (
              <TicketCheck size={22} color={focused ? activeColor : '#9CA3AF'} />
            ),
          }}
        />
      )}

      {/* Incident — driver, pickup_agent, agency_admin, system_admin, atpr_officer */}
      {showTab('Incident') && (
        <Tab.Screen
          name="Incident"
          component={(props:any) => <IncidentScreen {...props} />}
          options={{
            tabBarLabel: 'Incident',
            tabBarIcon: ({ color, focused }) => (
              <LucideMessageSquareWarning size={22} color={focused ? activeColor : '#9CA3AF'} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

// ── Auth guard ────────────────────────────────────────────────────────────────
// Renders a loading spinner while AsyncStorage is being read,
// then routes to the correct initial screen.
function AuthGate() {
  const { isAuthenticated, isInitialized, user } = useAuth();

  if (!isInitialized) {
    // Still restoring session from AsyncStorage
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#003DD0' }}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation:   'slide_from_right',
      }}
    >
      {isAuthenticated ? (
        // ── Authenticated routes ─────────────────────────────────────────────
        <Stack.Screen name="Home" component={RoleBasedTabs} />
      ) : (
        // ── Public routes ────────────────────────────────────────────────────
        <>
          <Stack.Screen name="Landing" component={Landing}        />
          <Stack.Screen name="Splash"  component={WelcomeScreen}  />
          <Stack.Screen name="Login"   component={LoginScreen}    />
        </>
      )}
    </Stack.Navigator>
  );
}

// ── Root navigator (wraps everything in AuthProvider) ─────────────────────────
export default function AppNavigator() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}