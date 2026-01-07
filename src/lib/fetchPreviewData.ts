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

function stripNonLLMFields(article: any) {
  const {
    embedding,
    ...rest
  } = article;

  return rest;
}

export async function fetchPreviewData(
  scope: PreviewScope = {},
): Promise<any[]> {
  const params = new URLSearchParams();

  params.set('limit', String(scope.limit ?? 20));

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

  const url = `${PREVIEW_API_URL}?${params.toString()}`;

  const res = await fetch(url, {
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

  const data = await res.json();

  /**
   * Defensive normalization:
   * - ensure array
   * - strip embeddings early
   */
  return Array.isArray(data)
    ? data.map(stripNonLLMFields)
    : [];
}
