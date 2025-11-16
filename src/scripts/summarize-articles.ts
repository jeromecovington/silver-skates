import { PrismaClient } from '@prisma/client';

import { RemoteLLMClient } from '../lib/llm/remote-client'
import { getSystemPrompt, getUserPrompt } from '../prompts/summarize-articles'

const prisma = new PrismaClient();
const llmClient = new RemoteLLMClient();

async function run() {
  const articles = await prisma.article.findMany({
    where: {
      summary: {
        equals: null
      }
    },
    take: 5, // adjust for safety
    select: { id: true, title: true, body: true },
  });

  for (const article of articles) {
    const content = `${article.title}\n\n${article.body}`;
    const completion = await llmClient.create([
      getSystemPrompt(),
      getUserPrompt(content)
    ]);

    const summary = completion.choices[0].message.content ?? '';

    await prisma.article.update({
      where: { id: article.id },
      data: { summary },
    });

    console.log(`✔ Summarized: ${article.title}`);
  }
}

run().catch(console.error);
