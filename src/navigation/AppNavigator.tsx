import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from 'components/login';
import WelcomeScreen from '@/Splash';
import Landing from '@/landing';
import HomeTabs from './BottomTabs';
import IncidentScreen from '@/Pages/IncidentScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right', // replaces CardStyleInterpolators
      }}
    >
      <Stack.Screen name="Landing" component={Landing} />
      <Stack.Screen name="Splash" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name='Home' component={HomeTabs} />
    </Stack.Navigator>
  );
}