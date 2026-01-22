import { Article, ArticlePreview } from '@/types';
import 'server-only';

const PREVIEW_API_URL = process.env.PREVIEW_API_URL ?? `http://localhost:3000/api/preview?token=${process.env.INGEST_SECRET}`;

type PreviewScope = {
  limit?: number;
  clusterIds?: string[];
  articleIds?: string[];
  sources?: string[];
  fromDate?: string;
  toDate?: string;
};

function stripNonLLMFields(article: Article): ArticlePreview {
  const {
    embedding, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...rest
  } = article;

  return rest;
}

export async function fetchPreviewData(
  scope: PreviewScope = {},
): Promise<ArticlePreview[]> {
  const params = new URLSearchParams();

  params.set('limit', String(scope.limit ?? Number(process.env.INGEST_MAX_RESULTS ?? 100)));

  scope.clusterIds?.forEach((id) =>
    params.append('clusterId', id),
  );

  scope.articleIds?.forEach((id) =>
    params.append('articleId', id),
  );

  scope.sources?.forEach((source) =>
    params.append('source', source),
  );

  if (scope.fromDate) {
    params.set('fromDate', scope.fromDate);
  }

  if (scope.toDate) {
    params.set('toDate', scope.toDate);
  }

  // TODO: Pass & use query params.
  const res = await fetch(PREVIEW_API_URL, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Preview API error (${res.status}): ${text}`,
    );
  }

  const { enriched } = await res.json();

  /**
   * Defensive normalization:
   * - ensure array
   * - strip embeddings early
   */
  return Array.isArray(enriched)
    ? enriched.map(stripNonLLMFields)
    : [];
}
