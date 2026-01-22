import { OpenAI } from 'openai';

/**
 * Thin wrapper around OpenAI’s Chat Completions API.
 * Keeps a compatible shape with LocalLLMClient so we can swap later.
 */
export class RemoteLLMClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey = process.env.OPENAI_API_KEY, model = 'gpt-3.5-turbo') {
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set.');
    }

    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Standardized chat-completion interface.
   * Expects an array of { role, content } message objects.
   */
  async create(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]) {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
    });

    return completion;
  }
}
