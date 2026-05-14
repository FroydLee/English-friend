import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SettingsForm } from '../components/SettingsForm';
import { type AppSettings } from '../types';
import { buildStorage, StorageKeys } from '../utils/storage';
import { DEFAULT_API_ENDPOINT, DEFAULT_MODEL, DAILY_MAX_CONVERSATIONS } from '../utils/constants';

const settingsStorage = buildStorage<AppSettings>(StorageKeys.SETTINGS);

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  apiEndpoint: DEFAULT_API_ENDPOINT,
  modelName: DEFAULT_MODEL,
  dailyMaxConversations: DAILY_MAX_CONVERSATIONS,
  enabled: true,
};

export function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await settingsStorage.get();
      if (stored) setSettings(stored);
      setLoaded(true);
    })();
  }, []);

  const handleSave = async (updated: AppSettings) => {
    await settingsStorage.save(updated);
    setSettings(updated);
    Alert.alert('Saved', 'Settings have been saved.');
  };

  if (!loaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>English Friend Settings</Text>
      <SettingsForm initialSettings={settings} onSave={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});
