import { NextRequest, NextResponse } from 'next/server';
import { create } from '@/lib/llm';
import { fetchPreviewData } from '@/lib/fetchPreviewData';

function shapeContext(
  articles: any[],
  opts: { includeBodies: boolean; maxArticles: number }
) {
  return articles.slice(0, opts.maxArticles).map((a, idx) => ({
    index: idx + 1,
    title: a.title,
    source: a.source,
    publishedAt: a.publishedAt,
    summary: a.summary,
    body: opts.includeBodies ? a.body : undefined,
  }));
}

function renderContext(context: any[]) {
  return context
    .map((a) => {
      return `
Article ${a.index}:
Title: ${a.title}
Source: ${a.source}
Published: ${a.publishedAt}
Summary: ${a.summary}
${a.body ? `Full text:\n${a.body}` : ''}
      `.trim();
    })
    .join('\n\n');
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    message,
    scope,           // filters, pinned articles, etc.
    includeBodies,   // progressive disclosure flag
  } = body;

  const previewData = await fetchPreviewData(scope);

  const context = shapeContext(previewData, {
    includeBodies,
    maxArticles: Number(process.env.INGEST_MAX_RESULTS ?? 100),
  });

  const messages = [
    {
      role: 'system',
      content: `
  You are an analytical assistant helping a user explore a specific set of news articles.

  In this step, your task is ONLY to identify which parts of the provided articles are relevant to the user's question.

  The articles below are the complete source material you are working from.
  Please focus on what the articles themselves say.

  Guidelines:
  - Look through the articles and identify any passages or claims that directly relate to the question.
  - Use only information that appears in the provided articles.
  - If an article is not relevant to the question, ignore it.
  - If none of the articles address the question, return an empty list.
  - Excerpts may be brief paraphrases, but they should faithfully reflect the article content.

  Return your response as a JSON array in the following format:

  [
    {
      "article": <number>,
      "excerpt": "<relevant excerpt or paraphrase>"
    }
  ]

  If there is no relevant information in the articles, return:

  []
      `.trim(),
    },
    {
      role: 'system',
      content: `
  Articles:
  ${renderContext(context)}
      `.trim(),
    },
    {
      role: 'user',
      content: `
  Question:
  ${message}
      `.trim(),
    },
  ];

  const response = await create(messages);

  const content =
    response?.choices?.[0]?.message?.content ??
    'No response from model';

  return NextResponse.json({
    reply: content,
  });
}
