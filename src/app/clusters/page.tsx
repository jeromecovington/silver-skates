import { ClustersPage as ClustersPageComponent } from '@/components/clusters/ClustersPage';
import { fetchPreviewData } from '@/lib/fetchPreviewData';
import { ArticlePreview } from '@/types';

export type ClusterSummary = {
  id: string;
  summary: string;
};

export type ArticleWithClusters = ArticlePreview & {
  clusterSummaries?: ClusterSummary[];
};

export type Cluster = {
  id: string;
  title: string;
  articles: ArticleWithClusters[];
};

function buildClusters(articles: ArticleWithClusters[]) {
  const clusters = new Map<string, Cluster>();

  for (const article of articles) {
    for (const cluster of article.clusterSummaries ?? []) {
      if (!clusters.has(cluster.id)) {
        clusters.set(cluster.id, {
          id: cluster.id,
          title: cluster.summary,
          articles: [],
        });
      }

      clusters.get(cluster.id)?.articles.push(article);
    }
  }

  for (const cluster of clusters.values()) {
    cluster.articles.sort(
      (a: ArticleWithClusters, b: ArticleWithClusters) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
    );
  }

  return Array.from(clusters.values());
}

export default async function ClustersPage() {
  const preview = await fetchPreviewData();
  const clusters = buildClusters(preview);

  return <ClustersPageComponent clusters={clusters} />;
}
