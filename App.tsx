
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import './global.css';
import AppNavigator from '@/navigation/AppNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
