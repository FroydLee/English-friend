import React, { useState } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { AppSettings } from '../types';
import { DEFAULT_API_ENDPOINT, DEFAULT_MODEL, DAILY_MAX_CONVERSATIONS } from '../utils/constants';

interface SettingsFormProps {
  initialSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function SettingsForm({ initialSettings, onSave }: SettingsFormProps) {
  const [apiKey, setApiKey] = useState(initialSettings.apiKey);
  const [endpoint, setEndpoint] = useState(initialSettings.apiEndpoint);
  const [model, setModel] = useState(initialSettings.modelName);
  const [dailyMax, setDailyMax] = useState(String(initialSettings.dailyMaxConversations));
  const [enabled, setEnabled] = useState(initialSettings.enabled);

  const handleSave = () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key required', 'Please enter an API key to use the app.');
      return;
    }
    onSave({
      apiKey: apiKey.trim(),
      apiEndpoint: endpoint.trim() || DEFAULT_API_ENDPOINT,
      modelName: model.trim() || DEFAULT_MODEL,
      dailyMaxConversations: parseInt(dailyMax, 10) || DAILY_MAX_CONVERSATIONS,
      enabled,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>API Key</Text>
      <TextInput
        style={styles.input}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="sk-..."
        secureTextEntry
        autoCapitalize="none"
      />

      <Text style={styles.label}>API Endpoint</Text>
      <TextInput
        style={styles.input}
        value={endpoint}
        onChangeText={setEndpoint}
        placeholder={DEFAULT_API_ENDPOINT}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Model</Text>
      <TextInput
        style={styles.input}
        value={model}
        onChangeText={setModel}
        placeholder={DEFAULT_MODEL}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Daily Max Conversations</Text>
      <TextInput
        style={styles.input}
        value={dailyMax}
        onChangeText={setDailyMax}
        keyboardType="numeric"
        placeholder={String(DAILY_MAX_CONVERSATIONS)}
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Enable Pet</Text>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  saveButton: {
    marginTop: 32,
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
