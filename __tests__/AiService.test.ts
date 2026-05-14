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
