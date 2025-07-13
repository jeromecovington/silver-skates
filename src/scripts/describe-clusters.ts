import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function run() {
  // Step 1: Get all articles with clusters
  const articles = await prisma.article.findMany({
    where: {
      clusters: { isEmpty: false },
    },
    select: {
      id: true,
      title: true,
      summary: true,
      clusters: true,
    },
  });

  // Step 2: Group articles by cluster ID
  const clusterGroups: Record<string, { title: string; summary: string | null }[]> = {};

  for (const article of articles) {
    for (const cluster of article.clusters) {
      if (!clusterGroups[cluster]) clusterGroups[cluster] = [];
      clusterGroups[cluster].push({ title: article.title, summary: article.summary });
    }
  }

  // Step 3: Generate and store cluster summaries
  for (const [clusterId, items] of Object.entries(clusterGroups)) {
    const existing = await prisma.clusterSummary.findUnique({ where: { id: clusterId } });
    if (existing) {
      console.log(`Skipping ${clusterId} (already summarized)`);
      continue;
    }

    const context = items
      .slice(0, 10) // limit to first 10 items per cluster
      .map((item, i) => `${i + 1}. ${item.title}${item.summary ? ': ' + item.summary : ''}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a journalist summarizing groups of news stories for a civic dashboard.',
        },
        {
          role: 'user',
          content: `Summarize the following cluster of news stories in 1–2 sentences:\n\n${context}`,
        },
      ],
    });

    const summary = completion.choices[0].message.content ?? '';

    await prisma.clusterSummary.create({
      data: {
        id: clusterId,
        summary,
      },
    });

    console.log(`✔ Cluster ${clusterId}: ${summary}`);
  }
}

run().catch(console.error);
