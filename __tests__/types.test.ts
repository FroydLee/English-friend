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
