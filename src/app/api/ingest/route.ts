import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { TfIdf } from 'natural';
import { pipeline } from '@xenova/transformers';

const prisma = new PrismaClient();

let embedder: any = null;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (token !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Lazy-load embedder
    if (!embedder) {
      embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }

    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        apiKey: process.env.NEWS_API_KEY,
        country: 'us',
        pageSize: 10,
      },
    });

    const articles = response.data.articles || [];
    const savedArticles = [];

    for (const article of articles) {
      const title = article.title?.trim();
      const body = article.content?.trim();
      const source = article.source?.name?.trim();
      const publishedAt = article.publishedAt || new Date().toISOString();

      if (!title || !body || !source) continue;

      // Check for duplicates
      const exists = await prisma.article.findFirst({
        where: { title, source },
      });

      if (exists) continue;

      // --- Keyword Extraction (TF-IDF) ---
      const tfidf = new TfIdf();
      tfidf.addDocument(body);
      const keywords = tfidf.listTerms(0).slice(0, 5).map(term => term.term);

      // --- Embedding Generation ---
      const embeddingResult = await embedder(title + '\n\n' + body, {
        pooling: 'mean',
        normalize: true,
      });

      const embedding = Array.from(embeddingResult.data[0] as number[]);

      // --- Save to DB ---
      const saved = await prisma.article.create({
        data: {
          title,
          body,
          source,
          publishedAt: new Date(publishedAt),
          biasRating: null,
          credibilityScore: null,
          clusters: [], // will be populated later
          keywords,
          embedding,
        },
      });

      savedArticles.push(saved);
    }

    return NextResponse.json({ added: savedArticles.length });
  } catch (error) {
    console.error('[ingest] error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
