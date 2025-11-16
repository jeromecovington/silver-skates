export function getSystemPrompt() {
  return {
    role: 'system',
    content: 'Summarize this article concisely in 2-3 sentences.',
  }
};

export function getUserPrompt(content: string) {
  return {
    role: 'user',
    content
  }
}
