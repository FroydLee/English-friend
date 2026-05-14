// ── Pet State Machine ──

export enum PetStatus {
  SLEEPING = 'SLEEPING',
  ACTIVE = 'ACTIVE',
  CONVERSING = 'CONVERSING',
}

// ── Conversation ──

export interface Message {
  role: 'system' | 'assistant' | 'user';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  messages: Message[];
  startedAt: number;
  endedAt?: number;
}

// ── User Profile ──

export interface UserProfile {
  interests: string[];
  mentionedTopics: string[];
  conversationCount: number;
  averageResponseTimeMs: number;
  coldKnowledgeShared: string[];
  lastChatAt: number | null;
}

// ── Settings ──

export interface AppSettings {
  apiKey: string;
  apiEndpoint: string;
  modelName: string;
  dailyMaxConversations: number;
  enabled: boolean;
}

// ── Wake Schedule ──

export interface WakeSchedule {
  nextWakeAt: number;
  consecutiveMisses: number;
  dailyConversationCount: number;
}

// ── Pet State (persisted snapshot) ──

export interface PetPersistedState {
  status: PetStatus;
  schedule: WakeSchedule;
}

// ── Native Module Interface ──

export interface FloatingWindowNative {
  startService(): Promise<void>;
  stopService(): Promise<void>;
  isServiceRunning(): Promise<boolean>;
}
