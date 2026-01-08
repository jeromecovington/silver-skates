export function getSystemPrompt() {
  return {
    role: 'system',
    content: 'You are a journalist summarizing groups of news stories for a civic dashboard.',
  }
};

export function getUserPrompt(context: string) {
  return {
    role: 'user',
    content: `Summarize the following cluster of news stories in 1–2 sentences:\n\n${context}`,
  }
}
