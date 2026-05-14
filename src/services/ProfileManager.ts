import { type UserProfile } from '../types';
import { buildStorage, StorageKeys } from '../utils/storage';

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

    // Mentioned topics: uncommon words with 3+ chars
    const newTopics = [...profile.mentionedTopics];
    for (const word of words) {
      if (word.length < 3) continue;
      if (!newInterests.has(word) && !newTopics.includes(word) && newTopics.length < 20) {
        newTopics.push(word);
      }
    }

    return { ...profile, interests: Array.from(newInterests), mentionedTopics: newTopics };
  }

  trackResponseTime(profile: UserProfile, responseTimeMs: number): UserProfile {
    const n = profile.conversationCount + 1;
    const newAvg =
      (profile.averageResponseTimeMs * (n - 1) + responseTimeMs) / n;
    return { ...profile, averageResponseTimeMs: Math.round(newAvg) };
  }
}
