import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PetStatus } from '../types';
import { PetAnimation } from './PetAnimation';
import { SpeechBubble } from './SpeechBubble';
import { ChatInput } from './ChatInput';
import { usePetContext } from '../state/PetContext';

export function PetOverlay() {
  const {
    status, wake, startConversation, endConversation,
    currentMessage, setCurrentMessage, sendReply, isLoading,
  } = usePetContext();

  const handlePetPress = () => {
    if (status === PetStatus.SLEEPING) {
      wake();
    } else if (status === PetStatus.ACTIVE) {
      startConversation();
    }
  };

  const handleSendReply = (text: string) => {
    sendReply(text);
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
      {status === PetStatus.CONVERSING && (
        <View style={styles.chatArea}>
          {isLoading && !currentMessage ? (
            <View style={styles.loadingBubble}>
              <Text style={styles.loadingText}>...</Text>
            </View>
          ) : currentMessage ? (
            <SpeechBubble message={currentMessage} onClose={handleClose} />
          ) : null}
          <ChatInput onSend={handleSendReply} disabled={isLoading} />
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
  loadingBubble: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    fontSize: 18,
    color: '#999',
  },
});
