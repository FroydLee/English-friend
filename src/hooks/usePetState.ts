import { useState, useCallback } from 'react';
import { PetStatus } from '../types';

export interface PetStateMachine {
  status: PetStatus;
  wake: () => void;
  startConversation: () => void;
  endConversation: () => void;
  timeout: () => void;
}

export function createPetStateMachine(initial: PetStatus = PetStatus.SLEEPING): PetStateMachine {
  let status = initial;

  return {
    get status() { return status; },

    wake() {
      if (status === PetStatus.SLEEPING) {
        status = PetStatus.ACTIVE;
      }
    },

    startConversation() {
      if (status === PetStatus.ACTIVE) {
        status = PetStatus.CONVERSING;
      }
    },

    endConversation() {
      if (status === PetStatus.CONVERSING || status === PetStatus.ACTIVE) {
        status = PetStatus.SLEEPING;
      }
    },

    timeout() {
      if (status === PetStatus.ACTIVE) {
        status = PetStatus.SLEEPING;
      }
    },
  };
}

export function usePetState(initial: PetStatus = PetStatus.SLEEPING) {
  const [status, setStatus] = useState<PetStatus>(initial);

  const wake = useCallback(() => {
    setStatus((s) => (s === PetStatus.SLEEPING ? PetStatus.ACTIVE : s));
  }, []);

  const startConversation = useCallback(() => {
    setStatus((s) => (s === PetStatus.ACTIVE ? PetStatus.CONVERSING : s));
  }, []);

  const endConversation = useCallback(() => {
    setStatus(PetStatus.SLEEPING);
  }, []);

  const timeout = useCallback(() => {
    setStatus((s) => (s === PetStatus.ACTIVE ? PetStatus.SLEEPING : s));
  }, []);

  return { status, wake, startConversation, endConversation, timeout };
}
