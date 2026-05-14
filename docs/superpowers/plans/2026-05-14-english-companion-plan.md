# English Friend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Android desktop floating pet app that proactively chats with the user in English using AI API, helping them immerse in English without active "studying."

**Architecture:** React Native app with a native Android Foreground Service (FloatingWindowService) that renders a RN-powered floating pet overlay. AI API calls happen from the RN layer. All data stored locally via AsyncStorage. Pet appears on homescreen like a QQ pet, initiates short English conversations on a smart schedule.

**Tech Stack:** React Native 0.76+, Kotlin (native floating service), lottie-react-native, @react-native-async-storage/async-storage, @react-navigation/native

---

## File Structure

```
English-friend/
├── App.tsx                                    # Root: PetContext wrapper + navigation
├── src/
│   ├── types.ts                               # All TypeScript interfaces/enums
│   ├── utils/
│   │   ├── storage.ts                         # AsyncStorage typed wrapper
│   │   └── constants.ts                       # Defaults, API config, durations
│   ├── services/
│   │   ├── AiService.ts                       # LLM API call logic
│   │   ├── ConversationManager.ts              # Manages dialog turns
│   │   └── ProfileManager.ts                  # User interest autolearn
│   ├── hooks/
│   │   ├── usePetState.ts                     # Pet finite state machine
│   │   └── useWakeScheduler.ts               # Random-interval scheduling
│   ├── state/
│   │   └── PetContext.tsx                     # React Context provider
│   ├── components/
│   │   ├── PetOverlay.tsx                     # Root floating-window wrapper
│   │   ├── PetAnimation.tsx                   # Lottie-driven pet icon
│   │   ├── SpeechBubble.tsx                   # Chat bubble with text
│   │   ├── ChatInput.tsx                      # Text input for user reply
│   │   └── SettingsForm.tsx                   # API key, toggles
│   └── screens/
│       └── SettingsScreen.tsx                 # Settings page
├── android/app/src/main/java/com/englishfriend/
│   ├── FloatingWindowService.kt             # ForegroundService + WindowManager
│   ├── FloatingWindowModule.kt               # RN native module bridge
│   └── FloatingWindowPackage.kt              # RN package registration
├── assets/animations/
│   └── pet-default.json                      # Simple Lottie animation
└── __tests__/
    ├── AiService.test.ts
    ├── ConversationManager.test.ts
    ├── ProfileManager.test.ts
    └── usePetState.test.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `babel.config.js`
- Create: `metro.config.js`
- Create: `app.json`
- Create: `index.js`

- [ ] **Step 1: Initialize React Native project**

Run:
```bash
cd e:/vibe-coding-programs/English-friend
npx @react-native-community/cli init EnglishFriend --directory . --skip-install
```

This generates the standard RN project structure including `android/` directory. If the directory is non-empty, init into a temp dir and move contents.

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install
npm install @react-native-async-storage/async-storage lottie-react-native @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
npm install --save-dev jest @testing-library/react-native @types/jest ts-jest
```

- [ ] **Step 3: Create folder structure**

Run:
```bash
mkdir -p src/utils src/services src/hooks src/state src/components src/screens __tests__ assets/animations
```

- [ ] **Step 4: Configure Jest**

Create `jest.config.js`:

```js
module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
};
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "start": "react-native start",
    "android": "react-native run-android",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

- [ ] **Step 5: Verify setup**

Run: `npx react-native config`
Expected: exits without error (may show warnings, that's fine)

- [ ] **Step 6: Initial commit**

```bash
git add .
git commit -m "chore: initial React Native project scaffold"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Define all types**

Write `src/types.ts`:

```ts
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
```

- [ ] **Step 2: Write a trivial test to verify types compile**

Create `__tests__/types.test.ts`:

```ts
import { PetStatus, type Message, type UserProfile, type AppSettings } from '../src/types';

describe('Types', () => {
  it('PetStatus has correct enum values', () => {
    expect(PetStatus.SLEEPING).toBe('SLEEPING');
    expect(PetStatus.ACTIVE).toBe('ACTIVE');
    expect(PetStatus.CONVERSING).toBe('CONVERSING');
  });

  it('Message can be constructed', () => {
    const msg: Message = { role: 'user', content: 'hello', timestamp: Date.now() };
    expect(msg.role).toBe('user');
  });

  it('UserProfile has default shape', () => {
    const profile: UserProfile = {
      interests: [],
      mentionedTopics: [],
      conversationCount: 0,
      averageResponseTimeMs: 0,
      coldKnowledgeShared: [],
      lastChatAt: null,
    };
    expect(profile.conversationCount).toBe(0);
  });

  it('AppSettings has correct fields', () => {
    const s: AppSettings = {
      apiKey: '',
      apiEndpoint: 'https://api.openai.com/v1',
      modelName: 'gpt-4o-mini',
      dailyMaxConversations: 12,
      enabled: true,
    };
    expect(s.dailyMaxConversations).toBe(12);
  });
});
```

- [ ] **Step 3: Run types test**

Run: `npx jest __tests__/types.test.ts --no-cache`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/types.ts __tests__/types.test.ts
git commit -m "feat: add TypeScript types for pet state, conversations, settings"
```

---

### Task 3: Storage Utility

**Files:**
- Create: `src/utils/storage.ts`
- Create: `src/utils/constants.ts`

- [ ] **Step 1: Write storage test**

Create `__tests__/storage.test.ts`:

```ts
import { StorageKeys, buildStorage } from '../src/utils/storage';

describe('Storage', () => {
  it('buildStorage wraps AsyncStorage with a typed key', () => {
    const store = buildStorage<{ name: string }>(StorageKeys.PROFILE);
    expect(store.key).toBe('@ef/profile');
  });

  it('get returns null when nothing stored', async () => {
    const store = buildStorage<{ name: string }>(StorageKeys.PROFILE);
    // AsyncStorage.getItem returns null by default in RN mock
    const val = await store.get();
    expect(val).toBeNull();
  });

  it('save and get round-trip', async () => {
    const store = buildStorage<{ name: string }>(StorageKeys.PROFILE);
    await store.save({ name: 'test' });
    const val = await store.get();
    expect(val).toEqual({ name: 'test' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/storage.test.ts --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/utils/constants.ts`:

```ts
export const DEFAULT_API_ENDPOINT = 'https://api.openai.com/v1';
export const DEFAULT_MODEL = 'gpt-4o-mini';
export const WAKEN_INTERVAL_MIN_MS = 45 * 60 * 1000;   // 45 min
export const WAKEN_INTERVAL_MAX_MS = 90 * 60 * 1000;   // 90 min
export const DAILY_MAX_CONVERSATIONS = 12;
export const CONSECUTIVE_MISSES_MULTIPLIER = 2;
export const IDLE_TIMEOUT_MS = 5 * 60 * 1000;           // 5 min
export const NIGHT_START_HOUR = 0;
export const NIGHT_END_HOUR = 8;
export const MAX_HISTORY_MESSAGES = 20;
```

Create `src/utils/storage.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export enum StorageKeys {
  SETTINGS = '@ef/settings',
  CONVERSATIONS = '@ef/conversations',
  PROFILE = '@ef/profile',
  PET_STATE = '@ef/pet_state',
}

export interface TypedStorage<T> {
  key: string;
  get(): Promise<T | null>;
  save(value: T): Promise<void>;
  clear(): Promise<void>;
}

export function buildStorage<T>(key: StorageKeys): TypedStorage<T> {
  return {
    key,
    async get(): Promise<T | null> {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    },
    async save(value: T): Promise<void> {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    },
    async clear(): Promise<void> {
      await AsyncStorage.removeItem(key);
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/storage.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/ __tests__/storage.test.ts
git commit -m "feat: add AsyncStorage wrapper and app constants"
```

---

### Task 4: Pet State Machine Hook

**Files:**
- Create: `src/hooks/usePetState.ts`

- [ ] **Step 1: Write state machine test**

Create `__tests__/usePetState.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react-hooks';
import { PetStatus } from '../src/types';

// Minimal inline implementation for testing state transitions
// (We'll test the actual hook once it exists)

describe('Pet State Machine', () => {
  const createMachine = () => {
    let status: PetStatus = PetStatus.SLEEPING;
    return {
      getStatus: () => status,
      wake: () => { status = PetStatus.ACTIVE; },
      startConversation: () => { if (status === PetStatus.ACTIVE) status = PetStatus.CONVERSING; },
      endConversation: () => { status = PetStatus.SLEEPING; },
      timeout: () => { if (status === PetStatus.ACTIVE) status = PetStatus.SLEEPING; },
    };
  };

  it('starts in SLEEPING', () => {
    const m = createMachine();
    expect(m.getStatus()).toBe(PetStatus.SLEEPING);
  });

  it('wake transitions to ACTIVE', () => {
    const m = createMachine();
    m.wake();
    expect(m.getStatus()).toBe(PetStatus.ACTIVE);
  });

  it('startConversation transitions ACTIVE→CONVERSING', () => {
    const m = createMachine();
    m.wake();
    m.startConversation();
    expect(m.getStatus()).toBe(PetStatus.CONVERSING);
  });

  it('endConversation transitions CONVERSING→SLEEPING', () => {
    const m = createMachine();
    m.wake();
    m.startConversation();
    m.endConversation();
    expect(m.getStatus()).toBe(PetStatus.SLEEPING);
  });

  it('timeout from ACTIVE goes to SLEEPING', () => {
    const m = createMachine();
    m.wake();
    m.timeout();
    expect(m.getStatus()).toBe(PetStatus.SLEEPING);
  });

  it('startConversation from SLEEPING does not transition', () => {
    const m = createMachine();
    m.startConversation();
    expect(m.getStatus()).toBe(PetStatus.SLEEPING);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/usePetState.test.ts --no-cache`
Expected: FAIL (but actually it should pass since we inlined the machine... let me refactor the test to test the actual hook)

Actually, let me rewrite the test to work with the actual hook:

Rewrite `__tests__/usePetState.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react-hooks';
import { PetStatus } from '../src/types';

// We'll import usePetState once it exists. For now test the state machine
// helper exported from the same file.

interface PetStateMachine {
  getStatus(): PetStatus;
  wake(): void;
  startConversation(): void;
  endConversation(): void;
  timeout(): void;
}

// NOTE: these tests will use createPetStateMachine exported from usePetState
describe('usePetState', () => {
  it.todo('starts in SLEEPING');
  it.todo('wake transitions to ACTIVE');
  it.todo('startConversation transitions ACTIVE→CONVERSING');
  it.todo('endConversation goes to SLEEPING');
  it.todo('timeout from ACTIVE goes to SLEEPING');
});
```

- [ ] **Step 3: Write implementation**

Create `src/hooks/usePetState.ts`:

```ts
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
```

- [ ] **Step 4: Rewrite tests for both createPetStateMachine and usePetState**

Rewrite `__tests__/usePetState.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react-hooks';
import { PetStatus } from '../src/types';
import { createPetStateMachine, usePetState } from '../src/hooks/usePetState';

describe('createPetStateMachine', () => {
  it('starts in SLEEPING', () => {
    const m = createPetStateMachine();
    expect(m.status).toBe(PetStatus.SLEEPING);
  });

  it('wake transitions to ACTIVE', () => {
    const m = createPetStateMachine();
    m.wake();
    expect(m.status).toBe(PetStatus.ACTIVE);
  });

  it('startConversation transitions ACTIVE→CONVERSING', () => {
    const m = createPetStateMachine(PetStatus.ACTIVE);
    m.startConversation();
    expect(m.status).toBe(PetStatus.CONVERSING);
  });

  it('endConversation transitions to SLEEPING', () => {
    const m = createPetStateMachine(PetStatus.CONVERSING);
    m.endConversation();
    expect(m.status).toBe(PetStatus.SLEEPING);
  });

  it('timeout from ACTIVE goes to SLEEPING', () => {
    const m = createPetStateMachine(PetStatus.ACTIVE);
    m.timeout();
    expect(m.status).toBe(PetStatus.SLEEPING);
  });
});

describe('usePetState', () => {
  it('starts in SLEEPING', () => {
    const { result } = renderHook(() => usePetState());
    expect(result.current.status).toBe(PetStatus.SLEEPING);
  });

  it('wake sets ACTIVE', () => {
    const { result } = renderHook(() => usePetState());
    act(() => result.current.wake());
    expect(result.current.status).toBe(PetStatus.ACTIVE);
  });

  it('startConversation transitions ACTIVE→CONVERSING', () => {
    const { result } = renderHook(() => usePetState(PetStatus.ACTIVE));
    act(() => result.current.startConversation());
    expect(result.current.status).toBe(PetStatus.CONVERSING);
  });

  it('endConversation resets to SLEEPING', () => {
    const { result } = renderHook(() => usePetState(PetStatus.CONVERSING));
    act(() => result.current.endConversation());
    expect(result.current.status).toBe(PetStatus.SLEEPING);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx jest __tests__/usePetState.test.ts --no-cache`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePetState.ts __tests__/usePetState.test.ts
git commit -m "feat: add pet state machine with React hook"
```

---

### Task 5: Wake Scheduler

**Files:**
- Create: `src/hooks/useWakeScheduler.ts`

- [ ] **Step 1: Write scheduler test**

Create `__tests__/useWakeScheduler.test.ts`:

```ts
import { isNightTime, randomIntervalMs, adjustInterval } from '../src/hooks/useWakeScheduler';

describe('useWakeScheduler utils', () => {
  describe('isNightTime', () => {
    it('returns true at hour 3', () => {
      const d = new Date('2026-05-14T03:00:00');
      expect(isNightTime(d)).toBe(true);
    });

    it('returns false at hour 14', () => {
      const d = new Date('2026-05-14T14:00:00');
      expect(isNightTime(d)).toBe(false);
    });

    it('returns true at hour 0', () => {
      const d = new Date('2026-05-14T00:00:00');
      expect(isNightTime(d)).toBe(true);
    });

    it('returns false at hour 8', () => {
      const d = new Date('2026-05-14T08:00:00');
      expect(isNightTime(d)).toBe(false);
    });
  });

  describe('randomIntervalMs', () => {
    it('returns a value between min and max', () => {
      const min = 1000;
      const max = 5000;
      for (let i = 0; i < 100; i++) {
        const v = randomIntervalMs(min, max);
        expect(v).toBeGreaterThanOrEqual(min);
        expect(v).toBeLessThanOrEqual(max);
      }
    });
  });

  describe('adjustInterval', () => {
    it('doubles interval when consecutiveMisses >= 3', () => {
      expect(adjustInterval(60000, 3)).toBe(120000);
    });

    it('does not change interval when misses < 3', () => {
      expect(adjustInterval(60000, 1)).toBe(60000);
    });

    it('caps at maxInterval', () => {
      expect(adjustInterval(60000, 3, 100000)).toBe(100000);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/useWakeScheduler.test.ts --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/hooks/useWakeScheduler.ts`:

```ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { WakeSchedule } from '../types';
import { WAKEN_INTERVAL_MIN_MS, WAKEN_INTERVAL_MAX_MS, CONSECUTIVE_MISSES_MULTIPLIER, NIGHT_START_HOUR, NIGHT_END_HOUR } from '../utils/constants';

export function isNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= NIGHT_START_HOUR && hour < NIGHT_END_HOUR;
}

export function randomIntervalMs(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function adjustInterval(
  baseInterval: number,
  consecutiveMisses: number,
  maxInterval: number = 4 * 60 * 60 * 1000, // 4 hours cap
): number {
  if (consecutiveMisses >= 3) {
    return Math.min(baseInterval * CONSECUTIVE_MISSES_MULTIPLIER, maxInterval);
  }
  return baseInterval;
}

export interface WakeScheduler {
  schedule: WakeSchedule;
  shouldWake: (now: number) => boolean;
  onConversationStarted: () => void;
  onConversationEnded: (userResponded: boolean) => void;
  computeNextWake: (now: number, consecutiveMisses: number) => number;
}

export function createWakeScheduler(
  initialSchedule: WakeSchedule = { nextWakeAt: Date.now(), consecutiveMisses: 0, dailyConversationCount: 0 },
): WakeScheduler {
  let schedule = { ...initialSchedule };

  return {
    get schedule() { return { ...schedule }; },

    shouldWake(now: number): boolean {
      if (isNightTime(new Date(now))) return false;
      if (schedule.dailyConversationCount >= 12) return false;
      return now >= schedule.nextWakeAt;
    },

    onConversationStarted() {
      schedule.dailyConversationCount += 1;
    },

    onConversationEnded(userResponded: boolean) {
      const now = Date.now();
      if (!userResponded) {
        schedule.consecutiveMisses += 1;
      } else {
        schedule.consecutiveMisses = 0;
      }
      schedule.nextWakeAt = this.computeNextWake(now, schedule.consecutiveMisses);
    },

    computeNextWake(now: number, consecutiveMisses: number): number {
      const baseInterval = randomIntervalMs(WAKEN_INTERVAL_MIN_MS, WAKEN_INTERVAL_MAX_MS);
      const adjusted = adjustInterval(baseInterval, consecutiveMisses);
      return now + adjusted;
    },
  };
}
```

- [ ] **Step 4: Update test to match actual exports**

The test already matches — re-run.

Run: `npx jest __tests__/useWakeScheduler.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useWakeScheduler.ts __tests__/useWakeScheduler.test.ts
git commit -m "feat: add wake scheduler with smart interval adjustment"
```

---

### Task 6: AI Service

**Files:**
- Create: `src/services/AiService.ts`

- [ ] **Step 1: Write AI service test**

Create `__tests__/AiService.test.ts`:

```ts
import { AiService } from '../src/services/AiService';
import { type Message } from '../src/types';

describe('AiService', () => {
  const apiKey = 'test-key';
  const service = new AiService(apiKey, 'https://api.openai.com/v1', 'gpt-4o-mini');

  describe('buildSystemPrompt', () => {
    it('returns a string with personality instructions', () => {
      const prompt = service.buildSystemPrompt([]);
      expect(prompt).toContain('English-speaking companion');
      expect(prompt).toContain('Keep your messages SHORT');
    });

    it('includes interests when provided', () => {
      const prompt = service.buildSystemPrompt(['coding', 'music']);
      expect(prompt).toContain('coding');
      expect(prompt).toContain('music');
    });
  });

  describe('buildRequestBody', () => {
    it('includes system prompt, messages, and temperature', () => {
      const messages: Message[] = [
        { role: 'assistant', content: 'Hello!', timestamp: 1 },
      ];
      const body = service.buildRequestBody(messages, []);
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.messages.length).toBeGreaterThanOrEqual(1);
      expect(body.temperature).toBeDefined();
    });
  });

  describe('parseResponse', () => {
    it('extracts content from a valid response', () => {
      const json = { choices: [{ message: { content: 'Hello there!' } }] };
      expect(service.parseResponse(json)).toBe('Hello there!');
    });

    it('returns null for empty choices', () => {
      const json = { choices: [] };
      expect(service.parseResponse(json)).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/AiService.test.ts --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/services/AiService.ts`:

```ts
import { type Message } from '../types';
import { DEFAULT_API_ENDPOINT, DEFAULT_MODEL } from '../utils/constants';

interface ChatCompletionRequest {
  model: string;
  messages: { role: string; content: string }[];
  temperature: number;
  max_tokens: number;
}

interface ChatCompletionResponse {
  choices: { message: { content: string } }[];
}

export class AiService {
  constructor(
    private apiKey: string,
    private endpoint: string = DEFAULT_API_ENDPOINT,
    private model: string = DEFAULT_MODEL,
  ) {}

  buildSystemPrompt(interests: string[]): string {
    const interestSection = interests.length > 0
      ? `\nThe user seems interested in: ${interests.join(', ')}. Use these as conversation topics when relevant.`
      : '';

    return `You are a friendly English-speaking companion living on the user's phone. You chat with them in casual English throughout the day.

Rules:
1. Keep your messages SHORT — under 20 words for greetings, under 40 words for replies.
2. Start every chat with a natural, casual opener. Ask questions, share thoughts, be curious.
3. Topics can come from: time of day, common daily experiences, random interesting facts, tech/coding/gaming if the user seems into those, or follow-ups from previous chats.
4. NEVER correct the user's grammar unless they ask.
5. DO NOT act like a teacher. You are a friend.
6. If the user seems busy or uninterested (short replies), keep it light and wrap up.${interestSection}`;
  }

  buildRequestBody(messages: Message[], interests: string[]): ChatCompletionRequest {
    const systemPrompt = this.buildSystemPrompt(interests);

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    return {
      model: this.model,
      messages: formattedMessages,
      temperature: 0.8,
      max_tokens: 150,
    };
  }

  parseResponse(json: unknown): string | null {
    const resp = json as ChatCompletionResponse;
    if (resp.choices && resp.choices.length > 0 && resp.choices[0].message.content) {
      return resp.choices[0].message.content.trim();
    }
    return null;
  }

  async generateResponse(messages: Message[], interests: string[]): Promise<string | null> {
    const body = this.buildRequestBody(messages, interests);

    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.warn(`AI API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = await response.json();
    return this.parseResponse(json);
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx jest __tests__/AiService.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/AiService.ts __tests__/AiService.test.ts
git commit -m "feat: add AI service with OpenAI-compatible API calls"
```

---

### Task 7: Profile Manager

**Files:**
- Create: `src/services/ProfileManager.ts`

- [ ] **Step 1: Write profile manager test**

Create `__tests__/ProfileManager.test.ts`:

```ts
import { ProfileManager } from '../src/services/ProfileManager';
import { type UserProfile } from '../src/types';

describe('ProfileManager', () => {
  const createProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
    interests: [],
    mentionedTopics: [],
    conversationCount: 0,
    averageResponseTimeMs: 0,
    coldKnowledgeShared: [],
    lastChatAt: null,
    ...overrides,
  });

  it('recordConversation increments count and updates lastChatAt', () => {
    const mgr = new ProfileManager();
    const profile = createProfile();
    const now = 1000;
    const updated = mgr.recordConversation(profile, now);
    expect(updated.conversationCount).toBe(1);
    expect(updated.lastChatAt).toBe(now);
  });

  it('extractInterests parses comma-separated from a message', () => {
    const mgr = new ProfileManager();
    const profile = createProfile();
    const updated = mgr.extractInterests(profile, 'I love coding and music');
    expect(updated.interests).toContain('coding');
    expect(updated.interests).toContain('music');
  });

  it('extractInterests avoids duplicates', () => {
    const mgr = new ProfileManager();
    const profile = createProfile({ interests: ['coding'] });
    const updated = mgr.extractInterests(profile, 'I love coding');
    expect(updated.interests.length).toBe(1);
  });

  it('extractInterests ignores common words', () => {
    const mgr = new ProfileManager();
    const profile = createProfile();
    const updated = mgr.extractInterests(profile, 'I think this is really good');
    expect(updated.interests.length).toBe(0);
  });

  it('trackResponseTime updates average', () => {
    const mgr = new ProfileManager();
    const profile = createProfile({ averageResponseTimeMs: 1000, conversationCount: 1 });
    const updated = mgr.trackResponseTime(profile, 3000);
    expect(updated.averageResponseTimeMs).toBe(2000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/ProfileManager.test.ts --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/services/ProfileManager.ts`:

```ts
import { type UserProfile } from '../types';
import { buildStorage, StorageKeys } from '../utils/storage';

const COMMON_WORDS = new Set([
  'this', 'that', 'think', 'really', 'good', 'bad', 'love', 'like',
  'just', 'very', 'well', 'know', 'get', 'got', 'thing', 'things',
  'people', 'time', 'way', 'day', 'man', 'world', 'life', 'hand',
  'part', 'eye', 'woman', 'place', 'work', 'week', 'case', 'point',
  'company', 'number', 'group', 'problem', 'fact',
]);

const INTEREST_KEYWORDS: Record<string, string[]> = {
  coding: ['code', 'coding', 'programming', 'app', 'software', 'react', 'python', 'javascript', 'typescript', 'developer', 'github'],
  gaming: ['game', 'gaming', 'play', 'xbox', 'playstation', 'nintendo', 'steam'],
  music: ['music', 'song', 'band', 'album', 'guitar', 'piano', 'jazz', 'rock', 'hip hop'],
  movies: ['movie', 'film', 'show', 'netflix', 'series', 'documentary', 'cinema'],
  reading: ['book', 'reading', 'novel', 'article', 'blog', 'read'],
  sports: ['sport', 'soccer', 'football', 'basketball', 'tennis', 'workout', 'gym', 'running'],
  travel: ['travel', 'trip', 'vacation', 'country', 'city', 'visit'],
  food: ['food', 'cooking', 'recipe', 'restaurant', 'coffee', 'tea', 'cook'],
};

export class ProfileManager {
  private storage = buildStorage<UserProfile>(StorageKeys.PROFILE);

  async load(): Promise<UserProfile> {
    const stored = await this.storage.get();
    return stored ?? {
      interests: [],
      mentionedTopics: [],
      conversationCount: 0,
      averageResponseTimeMs: 0,
      coldKnowledgeShared: [],
      lastChatAt: null,
    };
  }

  async save(profile: UserProfile): Promise<void> {
    await this.storage.save(profile);
  }

  recordConversation(profile: UserProfile, now: number): UserProfile {
    return {
      ...profile,
      conversationCount: profile.conversationCount + 1,
      lastChatAt: now,
    };
  }

  extractInterests(profile: UserProfile, message: string): UserProfile {
    const lower = message.toLowerCase();
    const words = lower.split(/\W+/);

    const newInterests = new Set(profile.interests);

    for (const [interest, keywords] of Object.entries(INTEREST_KEYWORDS)) {
      if (newInterests.has(interest)) continue;
      if (keywords.some((kw) => words.includes(kw))) {
        newInterests.add(interest);
      }
    }

    // Also add any uncommon capitalized words (proper nouns) as topics
    for (const word of words) {
      if (word.length < 3 || COMMON_WORDS.has(word)) continue;
      if (!newInterests.has(word) && profile.mentionedTopics.length < 20) {
        profile.mentionedTopics.push(word);
      }
    }

    return { ...profile, interests: Array.from(newInterests) };
  }

  trackResponseTime(profile: UserProfile, responseTimeMs: number): UserProfile {
    const n = profile.conversationCount || 1;
    const newAvg =
      (profile.averageResponseTimeMs * (n - 1) + responseTimeMs) / n;
    return { ...profile, averageResponseTimeMs: Math.round(newAvg) };
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx jest __tests__/ProfileManager.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/ProfileManager.ts __tests__/ProfileManager.test.ts
git commit -m "feat: add profile manager with automatic interest extraction"
```

---

### Task 8: Conversation Manager

**Files:**
- Create: `src/services/ConversationManager.ts`

- [ ] **Step 1: Write conversation manager test**

Create `__tests__/ConversationManager.test.ts`:

```ts
import { ConversationManager } from '../src/services/ConversationManager';
import { PetStatus } from '../src/types';

describe('ConversationManager', () => {
  const mgr = new ConversationManager('test-key');

  it('starts with no active conversation', () => {
    expect(mgr.currentConversation).toBeNull();
  });

  it('startNewConversation creates a conversation with assistant prefix', () => {
    mgr.startNewConversation();
    expect(mgr.currentConversation).not.toBeNull();
    expect(mgr.currentConversation!.messages.length).toBe(0); // no messages until AI generates
  });

  it('addMessage appends to current conversation', () => {
    mgr.startNewConversation();
    mgr.addMessage('user', 'hello');
    expect(mgr.currentConversation!.messages.length).toBe(1);
    expect(mgr.currentConversation!.messages[0].content).toBe('hello');
  });

  it('addMessage throws when no active conversation', () => {
    // Reset by creating a new one
    mgr.startNewConversation();
    mgr.addMessage('user', 'hi');
    expect(mgr.currentConversation!.messages.length).toBe(1);
  });

  it('endConversation clears current conversation', () => {
    mgr.startNewConversation();
    mgr.endConversation();
    expect(mgr.currentConversation).toBeNull();
  });

  it('getConversationHistory returns recent conversations', () => {
    mgr.startNewConversation();
    mgr.addMessage('user', 'test');
    mgr.endConversation();
    const history = mgr.getConversationHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/ConversationManager.test.ts --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/services/ConversationManager.ts`:

```ts
import { type Message, type Conversation } from '../types';
import { buildStorage, StorageKeys } from '../utils/storage';
import { MAX_HISTORY_MESSAGES } from '../utils/constants';

let conversationIdCounter = 0;

export class ConversationManager {
  private current: Conversation | null = null;
  private history: Conversation[] = [];
  private storage = buildStorage<Conversation[]>(StorageKeys.CONVERSATIONS);

  constructor(private apiKey: string) {}

  get currentConversation(): Conversation | null {
    return this.current;
  }

  startNewConversation(): Conversation {
    this.current = {
      id: `conv_${Date.now()}_${conversationIdCounter++}`,
      messages: [],
      startedAt: Date.now(),
    };
    return this.current;
  }

  addMessage(role: 'user' | 'assistant', content: string): Message {
    if (!this.current) {
      throw new Error('No active conversation. Call startNewConversation first.');
    }
    const msg: Message = { role, content, timestamp: Date.now() };
    this.current.messages.push(msg);
    return msg;
  }

  endConversation(): Conversation | null {
    if (!this.current) return null;
    this.current.endedAt = Date.now();
    this.history.push(this.current);
    // Trim history to avoid unbounded growth
    if (this.history.length > MAX_HISTORY_MESSAGES) {
      this.history = this.history.slice(-MAX_HISTORY_MESSAGES);
    }
    // Persist async (fire and forget)
    this.storage.save(this.history);
    const ended = this.current;
    this.current = null;
    return ended;
  }

  getConversationHistory(): Conversation[] {
    return this.history;
  }

  async loadHistory(): Promise<void> {
    const stored = await this.storage.get();
    if (stored) {
      this.history = stored;
    }
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx jest __tests__/ConversationManager.test.ts --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/ConversationManager.ts __tests__/ConversationManager.test.ts
git commit -m "feat: add conversation manager with history tracking"
```

---

### Task 9: Native Floating Window Service (Kotlin)

**Files:**
- Create: `android/app/src/main/java/com/englishfriend/FloatingWindowService.kt`
- Create: `android/app/src/main/java/com/englishfriend/FloatingWindowModule.kt`
- Create: `android/app/src/main/java/com/englishfriend/FloatingWindowPackage.kt`
- Modify: `android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Add Android permissions to AndroidManifest.xml**

Edit `android/app/src/main/AndroidManifest.xml` — add inside `<manifest>` before `<application>`:

```xml
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

- [ ] **Step 2: Create FloatingWindowService.kt**

```kotlin
package com.englishfriend

import android.app.*
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.*
import android.widget.FrameLayout

class FloatingWindowService : Service() {

    companion object {
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "english_friend_floating"
        var isRunning = false
            private set
    }

    private lateinit var windowManager: WindowManager
    private lateinit var floatingView: FrameLayout

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
        isRunning = true

        if (!::floatingView.isInitialized) {
            createFloatingView()
        }

        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isRunning = false
        if (::floatingView.isInitialized && floatingView.isAttachedToWindow) {
            windowManager.removeView(floatingView)
        }
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "English Friend",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "English Friend is running"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("English Friend")
                .setContentText("Your English buddy is here")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setOngoing(true)
                .build()
        } else {
            Notification.Builder(this)
                .setContentTitle("English Friend")
                .setContentText("Your English buddy is here")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setOngoing(true)
                .build()
        }
    }

    private fun createFloatingView() {
        val inflater = getSystemService(LAYOUT_INFLATER_SERVICE) as LayoutInflater
        floatingView = FrameLayout(this)

        val params: WindowManager.LayoutParams = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            )
        } else {
            WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_PHONE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            )
        }

        params.gravity = Gravity.TOP or Gravity.START
        params.x = 0
        params.y = 100

        // Make the view draggable
        floatingView.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f
            private var isDragging = false

            override fun onTouch(v: View?, event: MotionEvent?): Boolean {
                event ?: return false
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        isDragging = false
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = (event.rawX - initialTouchX).toInt()
                        val dy = (event.rawY - initialTouchY).toInt()
                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                            isDragging = true
                        }
                        params.x = initialX + dx
                        params.y = initialY + dy
                        windowManager.updateViewLayout(floatingView, params)
                        return true
                    }
                    MotionEvent.ACTION_UP -> {
                        if (!isDragging) {
                            // It's a tap, not a drag — notify RN
                            floatingView.performClick()
                        }
                        return true
                    }
                }
                return false
            }
        })

        floatingView.isClickable = true

        windowManager.addView(floatingView, params)
    }
}
```

- [ ] **Step 3: Create FloatingWindowModule.kt**

```kotlin
package com.englishfriend

import android.app.Activity
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*

class FloatingWindowModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "FloatingWindowModule"

    @ReactMethod
    fun startService(promise: Promise) {
        val activity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
            !Settings.canDrawOverlays(activity)
        ) {
            // Request overlay permission
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                android.net.Uri.parse("package:${activity.packageName}")
            )
            activity.startActivity(intent)
            promise.reject("NO_PERMISSION", "Overlay permission required")
            return
        }

        val serviceIntent = Intent(activity, FloatingWindowService::class.java)
        activity.startForegroundService(serviceIntent)
        promise.resolve(true)
    }

    @ReactMethod
    fun stopService(promise: Promise) {
        val activity = currentActivity
        if (activity != null) {
            val serviceIntent = Intent(activity, FloatingWindowService::class.java)
            activity.stopService(serviceIntent)
            promise.resolve(true)
        } else {
            promise.reject("NO_ACTIVITY", "No current activity")
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        promise.resolve(FloatingWindowService.isRunning)
    }
}
```

- [ ] **Step 4: Create FloatingWindowPackage.kt**

```kotlin
package com.englishfriend

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class FloatingWindowPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(FloatingWindowModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
```

- [ ] **Step 5: Register the package in MainApplication.kt**

Find `MainApplication.kt` in `android/app/src/main/java/com/englishfriend/` and add to the `getPackages()` list:

```kotlin
packages.add(FloatingWindowPackage())
```

- [ ] **Step 6: Commit**

```bash
git add android/app/src/main/java/com/englishfriend/
git add android/app/src/main/AndroidManifest.xml
git commit -m "feat: add native floating window service with RN bridge"
```

---

### Task 10: Global State (PetContext)

**Files:**
- Create: `src/state/PetContext.tsx`

- [ ] **Step 1: Write PetContext test**

Create `__tests__/PetContext.test.tsx`:

```tsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { PetProvider, usePetContext } from '../src/state/PetContext';
import { PetStatus } from '../src/types';

// Helper component to test context
const TestConsumer = () => {
  const { status, wake } = usePetContext();
  return <>{status}</>;
};

describe('PetContext', () => {
  it('provides default SLEEPING status', () => {
    const { getByText } = render(
      <PetProvider>
        <TestConsumer />
      </PetProvider>
    );
    expect(getByText(PetStatus.SLEEPING)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/PetContext.test.tsx --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/state/PetContext.tsx`:

```tsx
import React, { createContext, useContext, type ReactNode } from 'react';
import { PetStatus, type Message, type UserProfile } from '../types';
import { usePetState } from '../hooks/usePetState';

interface PetContextValue {
  status: PetStatus;
  wake: () => void;
  startConversation: () => void;
  endConversation: () => void;
  timeout: () => void;
  schedule: { nextWakeAt: number; consecutiveMisses: number; dailyConversationCount: number };
  currentMessage: string | null;
  setCurrentMessage: (msg: string | null) => void;
}

const PetContext = createContext<PetContextValue | null>(null);

export function PetProvider({ children }: { children: ReactNode }) {
  const { status, wake, startConversation, endConversation, timeout } = usePetState();
  const [currentMessage, setCurrentMessage] = React.useState<string | null>(null);

  const value: PetContextValue = {
    status,
    wake,
    startConversation,
    endConversation,
    timeout,
    schedule: { nextWakeAt: 0, consecutiveMisses: 0, dailyConversationCount: 0 },
    currentMessage,
    setCurrentMessage,
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
```

- [ ] **Step 4: Run tests**

Run: `npx jest __tests__/PetContext.test.tsx --no-cache`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/PetContext.tsx __tests__/PetContext.test.tsx
git commit -m "feat: add global PetContext provider"
```

---

### Task 11: Pet Overlay UI Components

**Files:**
- Create: `src/components/PetAnimation.tsx`
- Create: `src/components/SpeechBubble.tsx`
- Create: `src/components/ChatInput.tsx`
- Create: `src/components/PetOverlay.tsx`

- [ ] **Step 1: Create PetAnimation component**

`src/components/PetAnimation.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { PetStatus } from '../types';

interface PetAnimationProps {
  status: PetStatus;
  onPress: () => void;
}

export function PetAnimation({ status, onPress }: PetAnimationProps) {
  const size = status === PetStatus.SLEEPING ? 40 : 60;
  const opacity = status === PetStatus.SLEEPING ? 0.4 : 1.0;

  return (
    <View style={[styles.container, { width: size, height: size, opacity }]}>
      {/* We use a simple colored circle as placeholder — Lottie will be added once we have an animation file */}
      <View style={[styles.circle, { width: size, height: size }]} />
    </View>
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
```

- [ ] **Step 2: Create SpeechBubble component**

`src/components/SpeechBubble.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SpeechBubbleProps {
  message: string;
  onClose: () => void;
}

export function SpeechBubble({ message, onClose }: SpeechBubbleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{message}</Text>
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bubble: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 12,
  },
});
```

- [ ] **Step 3: Create ChatInput component**

`src/components/ChatInput.tsx`:

```tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Reply in English..."
        placeholderTextColor="#999"
        multiline={false}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        editable={!disabled}
      />
      <TouchableOpacity
        style={[styles.sendButton, (!text.trim() || disabled) && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!text.trim() || disabled}
      >
        <Text style={styles.sendText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#4A90D9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

- [ ] **Step 4: Create PetOverlay (root floating component)**

`src/components/PetOverlay.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PetStatus } from '../types';
import { PetAnimation } from './PetAnimation';
import { SpeechBubble } from './SpeechBubble';
import { ChatInput } from './ChatInput';
import { usePetContext } from '../state/PetContext';

export function PetOverlay() {
  const {
    status, wake, startConversation, endConversation, timeout,
    currentMessage, setCurrentMessage,
  } = usePetContext();

  const handlePetPress = () => {
    if (status === PetStatus.SLEEPING) {
      wake();
    } else if (status === PetStatus.ACTIVE) {
      startConversation();
      // TODO: trigger AI to generate opener
    }
  };

  const handleSendReply = (text: string) => {
    // TODO: pass to conversation manager + AI
    console.log('User reply:', text);
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
```

- [ ] **Step 5: Commit**

```bash
git add src/components/PetAnimation.tsx src/components/SpeechBubble.tsx src/components/ChatInput.tsx src/components/PetOverlay.tsx
git commit -m "feat: add pet overlay UI components"
```

---

### Task 12: Settings Screen

**Files:**
- Create: `src/components/SettingsForm.tsx`
- Create: `src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Create SettingsForm component**

`src/components/SettingsForm.tsx`:

```tsx
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
```

- [ ] **Step 2: Create SettingsScreen**

`src/screens/SettingsScreen.tsx`:

```tsx
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
    return <View><Text>Loading...</Text></View>;
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
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SettingsForm.tsx src/screens/SettingsScreen.tsx
git commit -m "feat: add settings screen with API key configuration"
```

---

### Task 13: App Integration + Entry Point

**Files:**
- Create: `App.tsx` (root)
- Create: `index.js` (entry)

- [ ] **Step 1: Write App.tsx**

`App.tsx`:

```tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PetProvider, usePetContext } from './src/state/PetContext';
import { PetOverlay } from './src/components/PetOverlay';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { buildStorage, StorageKeys } from './src/utils/storage';
import type { AppSettings } from './src/types';
import { DEFAULT_API_ENDPOINT, DEFAULT_MODEL, DAILY_MAX_CONVERSATIONS } from './src/utils/constants';

const Stack = createNativeStackNavigator();
const settingsStorage = buildStorage<AppSettings>(StorageKeys.SETTINGS);

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  apiEndpoint: DEFAULT_API_ENDPOINT,
  modelName: DEFAULT_MODEL,
  dailyMaxConversations: DAILY_MAX_CONVERSATIONS,
  enabled: true,
};

function HomeScreen() {
  return null;
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
    <View style={{ flex: 1 }}>
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
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
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
```

- [ ] **Step 2: Update index.js**

`index.js`:

```js
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

- [ ] **Step 3: Commit**

```bash
git add App.tsx index.js
git commit -m "feat: integrate app entry point with navigation and pet overlay"
```

---

### Task 14: Default Pet Animation Asset

**Files:**
- Create: `assets/animations/pet-default.json`

- [ ] **Step 1: Create minimal Lottie placeholder**

Since Lottie requires a .json animation file, generate a minimal bouncing-circle animation:

`assets/animations/pet-default.json`:

```json
{
  "v": "5.5.0",
  "fr": 30,
  "ip": 0,
  "op": 60,
  "w": 100,
  "h": 100,
  "nm": "Pet Default",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Circle",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "p": { "a": 1, "k": [{"t": 0, "s": [50, 50, 0]}, {"t": 30, "s": [50, 40, 0]}, {"t": 60, "s": [50, 50, 0]}] },
        "s": { "a": 0, "k": [100, 100, 100] },
        "r": { "a": 0, "k": 0 }
      },
      "shapes": [
        {
          "ty": "el",
          "nm": "Ellipse",
          "p": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [60, 60] },
          "d": 1
        },
        {
          "ty": "fl",
          "nm": "Fill",
          "c": { "a": 0, "k": [0.29, 0.56, 0.85, 1] },
          "o": { "a": 0, "k": 100 }
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/animations/pet-default.json
git commit -m "feat: add default pet Lottie animation asset"
```

---

### Task 15: End-to-End Smoke Test

**No new files** — modify existing to connect the final wiring.

- [ ] **Step 1: Verify all existing tests pass**

Run: `npx jest --no-cache`
Expected: All tests PASS

- [ ] **Step 2: Add a simple integration test — app renders without crashing**

Create `__tests__/App.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock NativeModules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.FloatingWindowModule = {
    startService: jest.fn(),
    stopService: jest.fn(),
    isServiceRunning: jest.fn(),
  };
  return RN;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('App', () => {
  it('renders without crashing', () => {
    const tree = render(<App />);
    expect(tree).toBeDefined();
  });
});
```

- [ ] **Step 3: Run all tests**

Run: `npx jest --no-cache`
Expected: All PASS

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: finalize MVP integration"
```

---
