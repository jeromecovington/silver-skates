# Silver Skates — Local‑First Architecture & Roadmap
*Version:* 2025-11-11 23:27
*Owner:* Jerome Covington
*Project:* Silver Skates (news analysis & classification)

---

## 1) Purpose & Non‑Goals
**Purpose.** Re‑platform Silver Skates as a **local‑first monolith** that ingests, clusters, and summarizes news on the user’s machine using an **open‑source LLM**. The full stack should run offline, be easily portable, and preserve the project’s civic aims (reduce outrage, improve context, expose sources).
**Non‑Goals (for this phase).** We will *not* commit to a specific LLM family, ship a production desktop app, or implement real‑time stream monitoring. Cloud inference is out of scope except for optional comparison tests.

---

## 2) Constraints & Principles
- **Local‑first by default.** No network required after install; explicit opt‑in for any external calls.
- **Transparent & explainable.** Preserve sources, show cluster membership rationale, surface uncertainty.
- **Deterministic & reproducible.** Pin models, tokenizers, and preprocessing; write seeds to logs.
- **Resource‑aware.** Support 3 tiers of hardware (see #12); ensure graceful degradation.
- **Additive evolution.** Maintain current pipeline shape: ingest → embed → cluster → summarize → serve.
- **Self‑contained deploy.** Single binary/container or one‑command setup; zero DB admin.

---

## 3) Target Architecture (Monolith)
**Runtime:** Node.js (TypeScript) primary, with isolated workers in Python *optional* for model tooling when necessary.
**App Layers (single repo):**
1. **Ingestion**: RSS/Atom + HTML extraction; optional local archives import (PDF/HTML).
2. **Processing**: text normalization → sentence splitting → embeddings → clustering → labeling.
3. **LLM Services**: local inference server (e.g., `llama.cpp`, `Ollama`, or `vLLM` local mode) wrapped by an internal client.
4. **Storage**: SQLite (via Prisma/Drizzle) + optional LiteLLM/Chroma/SQLite‑vec for vector index.
5. **API**: GraphQL Yoga or tRPC; private internal CLI for batch jobs.
6. **UI**: Next.js (SSR/SSG) dashboard hosted by the monolith.
7. **Scheduler**: lightweight cron (node‑cron) gated by “offline/airplane” mode.

**Why monolith?** Fewer moving parts, trivial packaging, simpler offline story, still testable.

---

## 4) Data Model (SQLite)
- `articles(id, url, title, publisher, published_at, fetched_at, lang, raw_html, text)`
- `embeddings(article_id, model, dim, vector, created_at)`
- `clusters(id, created_at, params_json)`
- `cluster_members(cluster_id, article_id, distance, label_score)`
- `summaries(target_type, target_id, model, role, tokens_in, tokens_out, text, created_at)`
- `labels(cluster_id, key, value, score)`
- `runs(id, started_at, finished_at, config_json, metrics_json, seed)`

> **Indexing:** Use `sqlite-vec` or `pgvector-lite` for approximate nearest neighbor if needed; fallback to cosine distance in memory for small corpora.

---

## 5) Pipeline (Offline)
1. **Ingest**: fetch feeds, dedupe by URL canonicalization, extract clean text (Readability + heuristics).
2. **Normalize**: language detect, remove boilerplate, split to chunks (sentence or 512‑1k tokens).
3. **Embed**: local embedding model (e.g., `bge-small-en`, `gte-small`, `all-MiniLM` converted to GGUF if needed).
4. **Cluster**: k‑means or HDBSCAN; elbow/silhouette auto‑K; persist `runs` with config & metrics.
5. **Summarize**: per article → per cluster → global daily narrative; bias/stance rubric pass (prompted).
6. **Serve**: UI presents cluster map, timelines, deltas, and source links.
7. **Review**: operator tools for relabeling and exclusion; all actions logged.

---

## 6) Local LLM & Embedding Options (Selection Happens Later)
- **Inference backends:** `Ollama` (quick start), `llama.cpp` (portable, CPU‑friendly), `vLLM` (GPU‑oriented).
- **Model families (candidates):** Llama‑3.1/3.2 variants, Qwen2/Qwen2.5, Phi‑4‑mini, Mistral/Mixtral.
- **Quantization:** 4‑bit (Q4_K_M) for CPU viability; 8‑bit/16‑bit for higher‑end GPUs.
- **Embeddings:** `bge-small-en`, `gte-small`, or `all-MiniLM-L6-v2`; prioritize ≤ 100MB footprint.
- **Tokenizer alignment:** Ensure summary model & embedder tokenization do not break chunking heuristics.

> **Abstraction:** Implement `ModelProvider` interface so backends swap without touching call sites.

---

## 7) Privacy & Governance
- **No telemetry by default.** Optional anonymized metrics toggle with clear UX.
- **On‑device encryption (optional).** OS‑native keychain for secrets; filesystem permissions.
- **Provenance.** Store canonical source URLs; show article counts per publisher per cluster.
- **Auditability.** Every batch has a `run` record with seeds, versions, hashes of model files.

---

## 8) Evaluation & QA
- **Clustering:** Silhouette, Davies–Bouldin, stability across seeds.
- **Summaries:** human rubric—coverage, neutrality, specificity, citation density.
- **Latency:** P50/P95 for ingest, embed, and summarize per N articles.
- **Footprint:** disk (< 2GB base install), RAM (≤ 8GB on CPU tier), tokens/sec by tier.
- **Regression tests:** snapshot expected clusters on a frozen corpus (e.g., 200 articles).

---

## 9) Developer Experience
- `yarn dev` → starts UI + API + local model provider (mock if unavailable).
- `bun run ingest [--days 1]`
- `bun run embed`
- `bun run cluster [--algo kmeans|hdbscan] [--k 10]`
- `bun run summarize [--level article|cluster|daily]`
- `bun run evaluate`
- `.env.local` strictly optional; defaults to offline.
- Seed script downloads small demo corpus (stored in repo for offline first‑run).

---

## 10) UI/UX Sketch
- **Home:** “Today’s clusters,” coverage histogram, notable deltas.
- **Cluster view:** narrative summary, member list, sources, dissenting angles (prompted), timeline.
- **Compare:** two clusters (or time slices) side‑by‑side: overlap, vocabulary shift, source mix.
- **Bias Lens:** rubric scores, quotes spectrum, missing‑stakeholder prompts.
- **Ops Pane:** rerun with different K, relabel, exclude sources, export JSON/CSV/MD.

---

## 11) Packaging & Distribution
- **Option A (recommended initially):** CLI + browser UI served by Node → zip/tarball release.
- **Option B:** Docker image with `--gpus all` optional; bind‑mount `~/SilverSkates`.
- **Option C (later):** Tauri/Electron desktop app once core stabilizes.

---

## 12) Hardware Tiers & Targets
1. **Tier A (CPU‑only, 16GB RAM laptop):** Q4 models, batch=1–2, embeddings small; P95 summarize ≤ 8s/chunk.
2. **Tier B (Entry GPU, e.g., 8GB VRAM):** 8‑bit, batch=4–8; P95 summarize ≤ 2s/chunk.
3. **Tier C (Workstation, 24–48GB VRAM):** 16‑bit, batch=16+; supports larger contexts & re‑ranking.

Fallback paths for each tier must be implemented and tested.

---

## 13) Security & Safety
- Strict CORS (localhost only), CSRF tokens for UI actions.
- Sandbox HTML parsing; strip scripts; sanitize outputs.
- Content warnings for graphic/NSFW; allow source filters.
- Model prompt safety rails (avoid sensational framing).

---

## 14) Risks & Mitigations
- **Model drift/quality variance.** Keep a blessed model set & fixtures; version everything.
- **Resource exhaustion.** Progressive batching, streaming decode, chunk budgeting.
- **Parser brittleness.** Maintain 2+ extraction strategies; store raw HTML.
- **Evaluation subjectivity.** Codify rubrics; inter‑rater reliability checks.
- **Legal/licensing.** Verify model/data licenses; keep a LICENSES.md with hashes.

---

## 15) Phased Roadmap (8–10 weeks, flexible)
**Phase 0 — Bootstrap (Week 1)**
- Repo scaffold, SQLite schema, demo corpus, minimal UI, mock LLM provider.

**Phase 1 — Local Embeddings (Weeks 2–3)**
- Integrate a local embedding model; build vector ops; cluster a small corpus; metrics.

**Phase 2 — Local Summarization (Weeks 3–5)**
- Run a CPU‑friendly open model; implement article/cluster/daily summaries; bias rubric v1.

**Phase 3 — UX & Ops (Weeks 5–7)**
- Cluster controls, delta views, exports, operator relabeling, evaluation harness.

**Phase 4 — Packaging & Tiers (Weeks 7–8)**
- Zip/Tar and Docker; document hardware tiers, benchmarks, and fallback behavior.

**Stretch — GPU Path & HDBSCAN (Weeks 9–10)**
- GPU inference path, HDBSCAN, and silhouette‑based auto‑K selection refinement.

---

## 16) Deliverables
- **Monolith repo** with CLI + UI and SQLite DB.
- **ModelProvider abstraction** with 2 backends (mock + one real local).
- **Evaluation suite** with fixed demo corpus and baselines.
- **Release artifacts** for Tier A (CPU) and Docker.
- **Docs:** INSTALL.md, OPERATIONS.md, EVALUATION.md, LICENSES.md.

---

## 17) Success Criteria (MVP)
- Runs 100% offline on a 16GB RAM laptop.
- Ingests ≥ 200 articles, forms ≥ 6 coherent clusters with reproducible metrics.
- Produces readable cluster narratives with cited sources and bias rubric.
- Ships as a single downloadable package with a one‑command start.

---

## 18) Open Questions (for next session)
1. Preferred initial inference backend: **Ollama** simplicity vs **llama.cpp** portability?
2. Minimum acceptable context window & quantization for summaries?
3. Embedding model choice: accuracy vs size for Tier A?
4. HDBSCAN vs k‑means default? Do we expose both?
5. What UX do we want for “dissenting angles” and “missing perspectives”?
6. Any must‑include publishers/feeds for the demo corpus?

---

*Prepared for review and iteration.*
