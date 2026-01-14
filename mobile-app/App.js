import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import { useAuthStore } from './src/stores/authStore';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExerciseScreen from './src/screens/ExerciseScreen';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import TreasureMapScreen from './src/screens/TreasureMapScreen';
import SendCoinsScreen from './src/screens/SendCoinsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#16213e' },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#888'
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>
        }}
      />
      <Tab.Screen
        name="Exercise"
        component={ExerciseScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏃</Text>
        }}
      />
      <Tab.Screen
        name="Treasure"
        component={TreasureMapScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺️</Text>
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💰</Text>
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { token, isLoading } = useAuthStore();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#1a1a2e' },
            headerTintColor: '#fff',
            contentStyle: { backgroundColor: '#0f0f23' }
          }}
        >
          {token ? (
            <>
              <Stack.Screen
                name="Main"
                component={MainTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Achievements"
                component={AchievementsScreen}
                options={{ title: 'Achievements' }}
              />
              <Stack.Screen
                name="SendCoins"
                component={SendCoinsScreen}
                options={{ title: 'Send & Receive' }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
