'use client';

import { ArticlePreview } from '@/types';
import { useState } from 'react';

type Cluster = {
  id: string;
  title: string;
  articles: ArticlePreview[];
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
    <section className="p-4 pb-2 border border-gray-400 mb-4">
      <h2 className="cursor-pointer" onClick={() => setOpen(!open)}>
        {cluster.title}
      </h2>
      <button className="border text-xs text-gray-400 uppercase p-2 my-2" onClick={() => setOpen(!open)}>
        {open ? 'Hide Articles' : 'Show Articles'}
      </button>

      {open && (
        <ul>
          {cluster.articles.map(article => (
            <ArticleItem key={article.id} article={article} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ArticleItem({ article }: { article: ArticlePreview }) {
  return (
    <li className="pt-2 border-t border-gray-400 mt-2">
      <h3 className="font-bold">
        {article.title}
      </h3>

      <span className="text-sm mb-2">
        {new Date(article.publishedAt).toLocaleDateString()}
      </span>

      <p className="italic">{article.summary}</p>
    </li>
  );
}
