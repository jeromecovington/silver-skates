import { ChatMessage } from "@/lib/llm/local-client"

export function getSystemPrompt(): ChatMessage {
  return {
    role: 'system',
    content: 'Summarize this article concisely in 2-3 sentences.',
  }
};

export function getUserPrompt(content: string): ChatMessage {
  return {
    role: 'user',
    content
  }
}
