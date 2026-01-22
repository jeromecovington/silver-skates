import { ChatMessage } from "@/lib/llm/local-client";

export function getSystemPrompt(): ChatMessage {
  return {
    role: 'system',
    content: `
You are a journalist writing a concise thematic description of a group of related news stories.

Your task is to describe the *shared theme or narrative* across the stories,
not to list, enumerate, or recap individual articles.
    `.trim(),
  };
}

export function getUserPrompt(context: string): ChatMessage {
  return {
    role: 'user',
    content: `
Write a 1–2 sentence narrative summary describing the common theme of the following news stories.

Important:
- Do NOT list or number articles.
- Do NOT mention individual headlines.
- Do NOT enumerate examples.
- Write a single, cohesive paragraph that abstracts across the stories.

News stories:
${context}
    `.trim(),
  };
}
