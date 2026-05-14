import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { PetStatus } from '../types';

interface PetContextValue {
  status: PetStatus;
  wake: () => void;
  startConversation: () => void;
  endConversation: () => void;
  timeout: () => void;
  currentMessage: string | null;
  setCurrentMessage: (msg: string | null) => void;
}

const PetContext = createContext<PetContextValue | null>(null);

export function PetProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PetStatus>(PetStatus.SLEEPING);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);

  const wake = () => {
    setStatus((s) => (s === PetStatus.SLEEPING ? PetStatus.ACTIVE : s));
  };

  const startConversation = () => {
    setStatus((s) => (s === PetStatus.ACTIVE ? PetStatus.CONVERSING : s));
  };

  const endConversation = () => {
    setStatus(PetStatus.SLEEPING);
    setCurrentMessage(null);
  };

  const timeout = () => {
    setStatus((s) => (s === PetStatus.ACTIVE ? PetStatus.SLEEPING : s));
  };

  const value: PetContextValue = {
    status, wake, startConversation, endConversation, timeout,
    currentMessage, setCurrentMessage,
  };

  return React.createElement(PetContext.Provider, { value }, children);
}

export function usePetContext(): PetContextValue {
  const ctx = useContext(PetContext);
  if (!ctx) {
    throw new Error('usePetContext must be used within a PetProvider');
  }
  return ctx;
}
