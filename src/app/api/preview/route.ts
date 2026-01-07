// src/app/api/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const expected = process.env.INGEST_SECRET;

  if (token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      take: Number(process.env.INGEST_MAX_RESULTS ?? 100),
    });

    const summaries = await prisma.clusterSummary.findMany();
    const summariesById = Object.fromEntries(summaries.map(s => [s.id, s.summary]));

    const enriched = articles.map((article) => ({
      ...article,
      clusterSummaries: article.clusters.map((clusterId) => ({
        id: clusterId,
        summary: summariesById[clusterId] ?? null,
      })),
    }));

    return NextResponse.json({ enriched });
  } catch (error) {
    console.error('[preview] error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
