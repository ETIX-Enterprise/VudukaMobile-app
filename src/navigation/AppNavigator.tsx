import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { HomeIcon, Telescope, TicketCheck, LucideMessageSquareWarning } from 'lucide-react-native';

import Landing                 from '@/landing';
import WelcomeScreen           from '@/Splash';
import LoginScreen             from '@/Auth/login';
import ForgotPasswordScreen    from '@/Auth/ForgotPassword';
import VerifyCodeScreen        from '@/Auth/VerifyCode';
import ResetPasswordScreen     from '@/Auth/ResetPassword';
import AgentHome               from '@/Pages/AgentHome';
import DiscoverScreen          from '@/Pages/Discoverandincidentpages';
import IncidentScreen          from '@/Pages/IncidentScreen';
import JourneyManagementScreen from '@/Pages/DriverJourney';

import { AuthProvider, useAuth, ROLE_CONFIG } from '../contexts/authContext';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();
const BLUE  = '#003DD0';

function RoleBasedTabs() {
  const { user } = useAuth();
  if (!user) return null;

  const roleConfig  = ROLE_CONFIG[user.role];
  const activeColor = roleConfig?.color ?? BLUE;
  const allowedTabs = roleConfig?.tabs  ?? [];
  const showTab     = (name: string) => allowedTabs.includes(name as any);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:             false,
        tabBarShowLabel:         true,
        tabBarLabelStyle:        { fontSize: 11, fontWeight: '600', marginTop: 2 },
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
      {showTab('Homescreen') && (
        <Tab.Screen name="Homescreen" component={AgentHome}
          options={{ tabBarLabel: 'Home',
            tabBarIcon: ({ focused }) => <HomeIcon size={22} color={focused ? activeColor : '#9CA3AF'} /> }} />
      )}
      {showTab('Discover') && (
        <Tab.Screen name="Discover" component={(p: any) => <DiscoverScreen {...p} />}
          options={{ tabBarLabel: 'Discover',
            tabBarIcon: ({ focused }) => <Telescope size={22} color={focused ? activeColor : '#9CA3AF'} /> }} />
      )}
      {showTab('Ticketverify') && (
        <Tab.Screen name="Ticketverify" component={JourneyManagementScreen}
          options={{ tabBarLabel: 'Journeys',
            tabBarIcon: ({ focused }) => <TicketCheck size={22} color={focused ? activeColor : '#9CA3AF'} /> }} />
      )}
      {showTab('Incident') && (
        <Tab.Screen name="Incident" component={(p: any) => <IncidentScreen {...p} />}
          options={{ tabBarLabel: 'Incident',
            tabBarIcon: ({ focused }) => <LucideMessageSquareWarning size={22} color={focused ? activeColor : '#9CA3AF'} /> }} />
      )}
    </Tab.Navigator>
  );
}

function AuthGate() {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0075A8' }}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {isAuthenticated ? (
        <Stack.Screen name="Home" component={RoleBasedTabs} />
      ) : (
        <>
          <Stack.Screen name="Landing"        component={Landing}             />
          <Stack.Screen name="Splash"         component={WelcomeScreen}       />
          <Stack.Screen name="Login"          component={LoginScreen}         />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen}/>
          <Stack.Screen name="VerifyCode"     component={VerifyCodeScreen}    />
          <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}