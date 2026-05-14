import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PetStatus } from '../types';
import { PetAnimation } from './PetAnimation';
import { SpeechBubble } from './SpeechBubble';
import { ChatInput } from './ChatInput';
import { usePetContext } from '../state/PetContext';

export function PetOverlay() {
  const {
    status, wake, startConversation, endConversation,
    currentMessage, setCurrentMessage,
  } = usePetContext();

  const handlePetPress = () => {
    if (status === PetStatus.SLEEPING) {
      wake();
    } else if (status === PetStatus.ACTIVE) {
      startConversation();
    }
  };

  const handleSendReply = (text: string) => {
    console.log('User reply:', text);
    // TODO: wire up AI service + conversation manager
  };

  const handleClose = () => {
    endConversation();
    setCurrentMessage(null);
  };

  if (status === PetStatus.SLEEPING) {
    return (
      <View style={styles.container}>
        <PetAnimation status={status} onPress={handlePetPress} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PetAnimation status={status} onPress={handlePetPress} />
      {status === PetStatus.CONVERSING && currentMessage && (
        <View style={styles.chatArea}>
          <SpeechBubble message={currentMessage} onClose={handleClose} />
          <ChatInput onSend={handleSendReply} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chatArea: {
    marginTop: 8,
    alignItems: 'center',
  },
});
