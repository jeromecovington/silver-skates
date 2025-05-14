import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Summarize this article concisely in 2-3 sentences.',
        },
        {
          role: 'user',
          content,
        },
      ],
    });

    const summary = completion.choices[0].message.content ?? '';

    await prisma.article.update({
      where: { id: article.id },
      data: { summary },
    });

    console.log(`✔ Summarized: ${article.title}`);
  }
}

run().catch(console.error);
