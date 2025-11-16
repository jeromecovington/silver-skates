/**
 * Placeholder client for local model execution.
 * Implements the same interface as RemoteLLMClient but raises until implemented.
 */
export class LocalLLMClient {
  constructor() {
    // Later we may initialize a local model here (e.g. Ollama, LM Studio, Transformers.js)
  }

  async create(_messages: { role: 'system' | 'user' | 'assistant'; content: string }[]) {
    throw new Error('Local LLM client is not yet implemented. Please configure a local model.');
  }
}
