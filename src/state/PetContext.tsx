import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { PetStatus, type AppSettings } from '../types';
import { AiService } from '../services/AiService';
import { ConversationManager } from '../services/ConversationManager';
import { ProfileManager } from '../services/ProfileManager';
import { createWakeScheduler, type WakeScheduler } from '../hooks/useWakeScheduler';
import { buildStorage, StorageKeys } from '../utils/storage';
import { DEFAULT_API_ENDPOINT, DEFAULT_MODEL } from '../utils/constants';

interface PetContextValue {
  status: PetStatus;
  wake: () => void;
  startConversation: () => void;
  endConversation: () => void;
  timeout: () => void;
  sendReply: (text: string) => Promise<void>;
  currentMessage: string | null;
  isLoading: boolean;
}

const settingsStorage = buildStorage<AppSettings>(StorageKeys.SETTINGS);
const PetContext = createContext<PetContextValue | null>(null);

export function PetProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PetStatus>(PetStatus.SLEEPING);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const servicesRef = useRef<{
    ai: AiService;
    conversation: ConversationManager;
    profile: ProfileManager;
    scheduler: WakeScheduler;
  } | null>(null);

  // Initialize services on mount
  useEffect(() => {
    (async () => {
      const settings = await settingsStorage.get();
      const apiKey = settings?.apiKey || '';
      const endpoint = settings?.apiEndpoint || DEFAULT_API_ENDPOINT;
      const model = settings?.modelName || DEFAULT_MODEL;

      const ai = new AiService(apiKey, endpoint, model);
      const conversation = new ConversationManager(apiKey);
      const profile = new ProfileManager();
      const scheduler = createWakeScheduler({
        nextWakeAt: Date.now(),
        consecutiveMisses: 0,
        dailyConversationCount: 0,
      });

      await conversation.loadHistory();

      servicesRef.current = { ai, conversation, profile, scheduler };
    })();
  }, []);

  // Generate opener when entering CONVERSING
  useEffect(() => {
    if (status !== PetStatus.CONVERSING) return;
    const services = servicesRef.current;
    if (!services) return;

    (async () => {
      setIsLoading(true);
      try {
        const profile = await services.profile.load();
        const response = await services.ai.generateResponse([], profile.interests);
        if (response) {
          services.conversation.startNewConversation();
          services.conversation.addMessage('assistant', response);
          setCurrentMessage(response);
        } else {
          setCurrentMessage("Hey! What's on your mind?");
        }
      } catch {
        setCurrentMessage("Hey! What's up?");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [status]);

  const wake = useCallback(() => {
    setStatus((s) => (s === PetStatus.SLEEPING ? PetStatus.ACTIVE : s));
  }, []);

  const startConversation = useCallback(() => {
    setStatus((s) => (s === PetStatus.ACTIVE ? PetStatus.CONVERSING : s));
  }, []);

  const endConversation = useCallback(() => {
    setStatus(PetStatus.SLEEPING);
    setCurrentMessage(null);
    servicesRef.current?.conversation.endConversation();
    servicesRef.current?.scheduler.onConversationEnded(true);
  }, []);

  const timeout = useCallback(() => {
    setStatus((s) => (s === PetStatus.ACTIVE ? PetStatus.SLEEPING : s));
  }, []);

  const sendReply = useCallback(async (text: string) => {
    const services = servicesRef.current;
    if (!services || status !== PetStatus.CONVERSING) return;

    setIsLoading(true);
    try {
      services.conversation.addMessage('user', text);

      let profile = await services.profile.load();
      profile = services.profile.recordConversation(profile, Date.now());
      profile = services.profile.extractInterests(profile, text);
      await services.profile.save(profile);

      const history = services.conversation.currentConversation?.messages || [];
      const response = await services.ai.generateResponse(history, profile.interests);

      if (response) {
        services.conversation.addMessage('assistant', response);
        setCurrentMessage(response);
      } else {
        setCurrentMessage('Sorry, I zoned out. Say that again?');
      }
    } catch {
      setCurrentMessage('Hmm, something went wrong. Can you say that again?');
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  const value: PetContextValue = {
    status, wake, startConversation, endConversation, timeout,
    sendReply, currentMessage, isLoading,
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
