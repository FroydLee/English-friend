import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PetProvider, usePetContext } from './src/state/PetContext';
import { PetOverlay } from './src/components/PetOverlay';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { buildStorage, StorageKeys } from './src/utils/storage';
import type { AppSettings } from './src/types';
import { DEFAULT_API_ENDPOINT, DEFAULT_MODEL, DAILY_MAX_CONVERSATIONS } from './src/utils/constants';

const Stack = createNativeStackNavigator();
const settingsStorage = buildStorage<AppSettings>(StorageKeys.SETTINGS);

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  apiEndpoint: DEFAULT_API_ENDPOINT,
  modelName: DEFAULT_MODEL,
  dailyMaxConversations: DAILY_MAX_CONVERSATIONS,
  enabled: true,
};

function HomeScreen() {
  return null;
}

function AppContent() {
  const { timeout } = usePetContext();

  useEffect(() => {
    const interval = setInterval(() => {
      timeout();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeout]);

  return (
    <View style={{ flex: 1 }}>
      <PetOverlay />
    </View>
  );
}

export default function App() {
  return (
    <PetProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <AppContent />
    </PetProvider>
  );
}
