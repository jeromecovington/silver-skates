import { PrismaClient } from '@prisma/client';
import kmeans from 'ml-kmeans';

type ArticleWithEmbedding = {
  id: string;
  embedding: number[];
};

const prisma = new PrismaClient();

async function runClustering() {
  const articles: ArticleWithEmbedding[] = await prisma.article.findMany({
    where: { embedding: { not: null } },
    select: { id: true, embedding: true },
  });

  const vectors = articles.map((a) => a.embedding);
  const k = 5; // can tune this later

  const { clusters } = kmeans(vectors, k);

  for (let i = 0; i < articles.length; i++) {
    await prisma.article.update({
      where: { id: articles[i].id },
      data: { clusters: [`cluster_${clusters[i]}`] },
    });
  }

  console.log(`Clustered ${articles.length} articles into ${k} groups.`);
}

runClustering();
