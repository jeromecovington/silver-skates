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
    maxArticles: 15,
  });

  const messages = [
    {
      role: 'system',
      content: `
  You are an analytical assistant helping users explore and reason about a news dataset.
  Base your answers strictly on the provided context.
  If information is missing or unclear, say so explicitly.
      `.trim(),
    },
    {
      role: 'system',
      content: renderContext(context),
    },
    {
      role: 'user',
      content: message,
    },
  ];

  const response = await create(messages);

  return NextResponse.json({
    reply: response,
  });
}
