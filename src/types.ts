export type Article = {
  id: string;
  title: string;
  body: string;
  source: string;
  publishedAt: Date;
  biasRating?: string | null;
  credibilityScore?: number | null;
  clusters: string[];
  keywords: string[];
  embedding: number[]; // 384-dim MiniLM vector
  summary?: string | null;
  createdAt: Date;
};

export type ArticlePreview = Omit<Article, 'embedding'>;

export type ShapedArticleContext = {
  index: number;
  title: string;
  source: string;
  publishedAt: Date;
  summary?: string | null;
  body?: string;
};
