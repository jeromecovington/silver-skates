/**
 * Unified entrypoint for all LLM usage.
 * Selects Remote (OpenAI) or Local (Ollama) client based on environment.
 *
 * Configuration:
 *   LLM_MODE = "remote" | "local"
 */

import { RemoteLLMClient } from './remote-client';
import { ChatMessage, LocalLLMClient } from './local-client';

const MODE = process.env.LLM_MODE ?? 'remote';

export type Response = {
  content: string;
};

export const llm =
  MODE === 'local' ? new LocalLLMClient() : new RemoteLLMClient();

/**
 * Convenience re-export of the common create() interface
 * so other modules can simply `import { create } from '@/lib/llm'`
 */
export const create = async (
  messages: ChatMessage[],
) => llm.create(messages);
