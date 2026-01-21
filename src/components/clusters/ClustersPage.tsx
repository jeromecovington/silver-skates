'use client';

import { useState } from 'react';

type Article = {
  id: string;
  title: string;
  summary: string;
  body: string;
  publishedAt: string;
};

type Cluster = {
  id: string;
  title: string;
  articles: Article[];
};

export function ClustersPage({ clusters }: { clusters: Cluster[] }) {
  return (
    <main className="mx-6 my-8">
      {clusters.map(cluster => (
        <ClusterCard key={cluster.id} cluster={cluster} />
      ))}
    </main>
  );
}

function ClusterCard({ cluster }: { cluster: Cluster }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-4 border-b pb-4">
      <h2 className="cursor-pointer font-bold" onClick={() => setOpen(!open)}>
        {cluster.title}
      </h2>

      {open && (
        <ul className="mt-2">
          {cluster.articles.map(article => (
            <ArticleItem key={article.id} article={article} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ArticleItem({ article }: { article: Article }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="list-disc mb-4 ml-6">
      <h3 onClick={() => setExpanded(!expanded)}>
        {article.title}
      </h3>

      <p>{article.summary}</p>

      {expanded && (
        <article>
          <p>{article.body}</p>
        </article>
      )}
    </li>
  );
}
