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
    try {
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
    } catch (e) {
      console.warn('AI API request failed:', e);
      return null;
    }
  }
}
