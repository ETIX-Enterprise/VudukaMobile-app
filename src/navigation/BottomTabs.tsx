import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import {
  FileWarning,
  HomeIcon,
  LucideMessageSquareWarning,
  Telescope,
  TicketCheck,
  
} from 'lucide-react-native';
import AgentHome from '@/Pages/AgentHome';
import Discover from '@/Pages/Discover';
import DiscoverScreen from '@/Pages/Discoverandincidentpages';
import { HomeTabParamList } from '@/Pages/types';
import IncidentScreen from '@/Pages/IncidentScreen';
import TicketVerificationScreen from '@/Pages/DriverVerify';
const Tab = createBottomTabNavigator<HomeTabParamList>();

export default function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
    headerShown: false,
    tabBarShowLabel: false,
    tabBarStyle: {    
      backgroundColor: '#FFFFFF',
      height: 70,            
      paddingTop: 13,
      borderTopWidth: 0,
        },
      }}
    >
      <Tab.Screen
        name="Homescreen"
        component={AgentHome}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              icon={HomeIcon}
              label="Home"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              icon={Telescope}
              label="Discover"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Ticketverify"
        component={TicketVerificationScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              icon={TicketCheck}
              label="Verify"
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Incident"
        component={IncidentScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              icon={LucideMessageSquareWarning}
              label="Incident"
              focused={focused}
            />
          ),
        }}
      />
      
    </Tab.Navigator>
  );
}

function TabItem({
  icon: Icon,
  label,
  focused,
}: {
  icon: any;
  label: string;
  focused: boolean;
}) {

  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: 6,
        width: 90,
        paddingHorizontal: 14,
        borderRadius: 15,
        backgroundColor: focused ? '#003DD014' : 'transparent',
      }}
    >
      <Icon
        size={22}
        color={focused ? '#003DD0' : '#E5E7EB'}
      />
      <Text
      className='font-inter-semibold'
        style={{
          fontSize: 11,
          marginTop: 4,
          color: focused ? '#003DD0' : 'black',
        }}
      >
        {label}
      </Text>
      <StatusBar style="light" />
    </View>
  );
}
