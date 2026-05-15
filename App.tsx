import React, { useEffect } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PetProvider, usePetContext } from './src/state/PetContext';
import { PetOverlay } from './src/components/PetOverlay';
import { ChatScreen } from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function ChatHeaderRight() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginRight: 8 }}>
      <Text style={{ fontSize: 16, color: '#4A90D9' }}>Settings</Text>
    </TouchableOpacity>
  );
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
    <View style={{ flex: 1 }} pointerEvents="box-none">
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
            name="Chat"
            component={ChatScreen}
            options={{
              title: 'English Friend',
              headerRight: () => <ChatHeaderRight />,
            }}
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
