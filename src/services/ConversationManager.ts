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
    if (this.history.length > MAX_HISTORY_MESSAGES) {
      this.history = this.history.slice(-MAX_HISTORY_MESSAGES);
    }
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
