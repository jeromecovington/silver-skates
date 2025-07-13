import { PrismaClient } from '@prisma/client';
import { kmeans } from 'ml-kmeans';

const prisma = new PrismaClient();

type ArticleWithEmbedding = {
  id: string;
  embedding: number[];
};

async function runClustering() {
  const articles: ArticleWithEmbedding[] = await prisma.article.findMany({
    where: {
      NOT: {
        embedding: {
          equals: [],
        },
      },
    },
    select: {
      id: true,
      embedding: true,
    },
  });

  if (articles.length === 0) {
    console.log('No articles with embeddings found.');
    return;
  }

  const vectors = articles.map((a) => a.embedding);
  const k = Math.min(5, articles.length); // avoid overfitting

  const result = kmeans(vectors, k, {}); // returns { clusters, centroids }

  for (let i = 0; i < articles.length; i++) {
    await prisma.article.update({
      where: { id: articles[i].id },
      data: { clusters: [`cluster_${result.clusters[i]}`] },
    });
  }

  console.log(`Clustered ${articles.length} articles into ${k} groups.`);
}

runClustering().catch((err) => {
  console.error('Clustering failed:', err);
});
