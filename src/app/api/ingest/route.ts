// src/app/api/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (token !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
      if (!article.title || !article.content || !article.source?.name) continue;

      const exists = await prisma.article.findFirst({
        where: {
          title: article.title,
          source: article.source.name,
        },
      });

      if (exists) continue;

      const saved = await prisma.article.create({
        data: {
          title: article.title,
          body: article.content,
          source: article.source.name,
          publishedAt: new Date(article.publishedAt || Date.now()),
          biasRating: null,
          credibilityScore: null,
          clusters: [],
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
