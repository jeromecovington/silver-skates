/**
 * LocalLLMClient — Ollama adapter
 *
 * Wraps the Ollama REST API (non-streaming mode).
 * Mirrors RemoteLLMClient's `create(messages)` interface.
 *
 * Configuration:
 *   LLM_BASE_URL (default: http://localhost:11434)
 *   LLM_MODEL    (default: llama3)
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletion {
  choices: {
    message: {
      role: 'assistant';
      content: string;
    };
  }[];
};

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: { role: string; content: string };
  done: boolean;
}

export class LocalLLMClient {
  private baseUrl: string;
  private model: string;

  constructor(
    baseUrl = process.env.LLM_BASE_URL || 'http://localhost:11434',
    model = process.env.LLM_MODEL || 'llama3',
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  /**
   * Sends chat messages to a locally hosted Ollama model.
   * Returns the assistant's full reply as a string.
   */
  async create(messages: ChatMessage[]): Promise<LLMCompletion> {
    const url = `${this.baseUrl}/api/chat`;

    const body = {
      model: this.model,
      messages,
      stream: false,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Local LLM request failed (${response.status}): ${text}`,
      );
    }

    const data: OllamaChatResponse = await response.json();
    const content = data?.message?.content ?? '';

    return {
      choices: [
        {
          message: {
            role: 'assistant',
            content: content.trim(),
          },
        },
      ],
    };
  }
}
