import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { TfIdf } from 'natural';
import { pipeline } from '@xenova/transformers';

const prisma = new PrismaClient();

async function main() {
  console.log('[ingest] starting ingestion...');

  const pageSize = Number(process.env.INGEST_PAGE_SIZE ?? 25);
  const maxResults = Number(process.env.INGEST_MAX_RESULTS ?? 100);
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    throw new Error('Missing NEWS_API_KEY');
  }

  // Lazy-load embedder model
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  // Get the latest published article timestamp for windowing
  const lastArticle = await prisma.article.findFirst({
    orderBy: { publishedAt: 'desc' },
  });
  const lastIngestedAt = lastArticle?.publishedAt ?? new Date(0);
  console.log(`[ingest] last ingested article at ${lastIngestedAt.toISOString()}`);

  let totalAdded = 0;
  let page = 1;
  let hasMore = true;

  while (hasMore && totalAdded < maxResults) {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        apiKey,
        country: 'us',
        page,
        pageSize,
      },
    });

    const articles = response.data.articles || [];
    if (articles.length === 0) break;

    for (const article of articles) {
      const title = article.title?.trim();
      const body = article.content?.trim();
      const source = article.source?.name?.trim();
      const publishedAt = new Date(article.publishedAt || new Date());

      // Skip invalid or already-seen articles
      if (!title || !body || !source) continue;
      if (publishedAt <= lastIngestedAt) {
        hasMore = false;
        break;
      }

      const exists = await prisma.article.findFirst({ where: { title, source } });
      if (exists) continue;

      // --- Keyword Extraction (TF-IDF) ---
      const tfidf = new TfIdf();
      tfidf.addDocument(body);
      const keywords = tfidf.listTerms(0).slice(0, 5).map((term) => term.term);

      // --- Embedding Generation ---
      const embeddingResult = await embedder(title + '\n\n' + body, {
        pooling: 'mean',
        normalize: true,
      });
      const embedding = Array.from(embeddingResult.data) as number[];

      // --- Save to DB ---
      await prisma.article.create({
        data: {
          title,
          body,
          source,
          publishedAt,
          biasRating: null,
          credibilityScore: null,
          clusters: [],
          keywords,
          embedding,
        },
      });

      totalAdded++;
      console.log(`[ingest] saved (${totalAdded}): ${title}`);

      // Respect the overall cap
      if (totalAdded >= maxResults) {
        hasMore = false;
        break;
      }
    }

    page++;
  }

  console.log(`[ingest] added ${totalAdded} new articles.`);
}

main()
  .catch((err) => {
    console.error('[ingest] error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('[ingest] complete.');
  });
