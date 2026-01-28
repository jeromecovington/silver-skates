import { NextRequest, NextResponse } from 'next/server';
import { create } from '@/lib/llm';
import { fetchPreviewData } from '@/lib/fetchPreviewData';
import { ChatMessage } from '@/lib/llm/local-client';
import { ArticlePreview, ShapedArticleContext } from '@/types';

function shapeContext(
  articles: ArticlePreview[],
  opts: { maxArticles: number }
): ShapedArticleContext[] {
  return articles.slice(0, opts.maxArticles).map((a, idx) => ({
    index: idx + 1,
    title: a.title,
    source: a.source,
    publishedAt: a.publishedAt,
    summary: a.summary,
  }));
}

function renderContext(context: ShapedArticleContext[]) {
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
  } = body;

  const previewData = await fetchPreviewData(scope);

  const context = shapeContext(previewData, {
    maxArticles: scope.limit ?? Number(process.env.INGEST_MAX_RESULTS ?? 100),
  });

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `
  You are an analytical assistant helping a user explore and reason about a specific set of news articles.

  Think of it as if you are operating in a STRICT CONTEXT MODE, using only the articles below.

  You may be asked to identify trends, broad topics, or relationships between ONLY the provided articles.

  The articles below are the COMPLETE SOURCE material you are working from.
  Please focus on ONLY what the provided articles themselves say.

  Guidelines:
  - Look through the provided articles ONLY and identify any passages or claims that directly relate to the question.
  - Use only information that appears ONLY in the provided articles.
  - If an article is not relevant to the question, ignore it.
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
