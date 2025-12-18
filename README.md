# News Summarization Proof of Concept

A Next.js + TypeScript project for ingesting, embedding, clustering, and exploring news articles.

---

## Setup

### 1. Clone the repo and install dependencies

```bash
git clone https://github.com/jeromecovington/silver-skates.git
cd silver-skates
yarn install
```

```bash
npm install -g bun
```

### 2. Configure environment

Create a `.env.local` file at the project root:

```dotenv
NEWS_API_KEY=your_newsapi_key
INGEST_SECRET=your_custom_token
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb
```

---

## Postgres Setup

### Option A: Docker (recommended for local dev)

```bash
docker run --name news-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  -d postgres:15
```

### Option B: Local Postgres install

Make sure Postgres is running and create the `mydb` database:

```bash
createdb mydb
```

---

## Prisma

### 1. Generate Prisma client

```bash
npx prisma@6 generate
```

### 2. Run DB migration

```bash
npx prisma@6 migrate dev --name init
```

---

## Ingest > Cluster > Preview

### ✅ Ingest articles from NewsAPI

#### Preferred method: script

```bash
bun run ingest
```

#### Deprecated method: api call

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Authorization: Bearer your_custom_token"
```

This will:
- Fetch new articles
- Deduplicate
- Extract keywords
- Generate MiniLM embeddings
- Store in Postgres

---

### Cluster articles by semantic similarity

```bash
bun run cluster
```

This uses K-Means clustering on embeddings and stores cluster IDs in each article.

---

### Summarize articles with GPT or local model

#### GPT (default)
```bash
bun run summarize
```

This uses OpenAI’s `gpt-3.5-turbo` model to generate concise 2–3 sentence summaries for articles that do not yet have a summary. Summaries are stored in the summary field of each article and surfaced via the `/api/preview` endpoint.

#### Local Model
```bash
LLM_MODE=local \
LLM_BASE_URL=http://localhost:11434 \
LLM_MODEL=mistral \
bun run summarize
```

This assumes Ollama running locally or on your LAN, and installation of the `mistral` model.

---

### Preview recent articles

```bash
curl "http://localhost:3000/api/preview?token=your_custom_token"
```

Returns latest articles, including keywords and cluster assignments.

---

## Scripts Summary

| Script                         | Description                    |
|-------------------------------|--------------------------------|
| `/api/ingest` (GET)           | Ingest articles                |
| `/api/preview` (GET)          | View recent article data       |
| `src/scripts/cluster-articles.ts` | Run K-Means clustering     |

---

## Notes

- Embeddings generated via `@xenova/transformers` (MiniLM)
- Clustering via `ml-kmeans`
- Keywords via TF-IDF from `natural`

