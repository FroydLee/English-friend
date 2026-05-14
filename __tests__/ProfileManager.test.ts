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

  it('extractInterests parses interest keywords from a message', () => {
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
