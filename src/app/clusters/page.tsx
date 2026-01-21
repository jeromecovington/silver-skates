import { ClustersPage as ClustersPageComponent } from '@/components/clusters/ClustersPage';
import { fetchPreviewData } from '@/lib/fetchPreviewData';

function buildClusters(articles: any[]) {
  const clusters = new Map<string, any>();

  for (const article of articles) {
    for (const cluster of article.clusterSummaries ?? []) {
      if (!clusters.has(cluster.id)) {
        clusters.set(cluster.id, {
          id: cluster.id,
          title: cluster.summary,
          articles: [],
        });
      }

      clusters.get(cluster.id).articles.push(article);
    }
  }

  for (const cluster of clusters.values()) {
    cluster.articles.sort(
      (a, b) =>
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
