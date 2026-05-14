import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { PetStatus } from '../types';

interface PetAnimationProps {
  status: PetStatus;
  onPress: () => void;
}

export function PetAnimation({ status, onPress }: PetAnimationProps) {
  const size = status === PetStatus.SLEEPING ? 40 : 60;
  const opacity = status === PetStatus.SLEEPING ? 0.4 : 1.0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, { width: size, height: size, opacity }]}
    >
      <View style={[styles.circle, { width: size, height: size }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    borderRadius: 999,
    backgroundColor: '#4A90D9',
  },
});
