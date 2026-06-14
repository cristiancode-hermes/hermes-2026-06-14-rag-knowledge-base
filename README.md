# RAG Knowledge Base

**Upload documents, ask questions, and get AI-powered answers with citations — a full Retrieval-Augmented Generation pipeline running entirely on your machine.**

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          RAG Knowledge Base                              │
│                                                                          │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────────┐ │
│  │  Angular  │      │  NestJS  │      │  SQLite  │      │ TF-IDF +     │ │
│  │  Frontend │─────▶│  API     │─────▶│  (Neon-  │      │ Cosine Sim   │ │
│  │  (port    │◀─────│  Server  │◀─────│  ready)  │◀─────│ Embeddings   │ │
│  │   4200)   │ JSON │  (port   │ TypeORM      │      │              │ │
│  │           │  API │   3000)  │              │      │              │ │
│  └──────────┘      └──────────┘      └──────────┘      └──────────────┘ │
│                         │                                               │
│                         ▼                                               │
│              ┌─────────────────────┐                                    │
│              │  RAG Pipeline       │                                    │
│              │                     │                                    │
│              │  Document ──▶ Chunk ──▶ Embed ──▶ Retrieve ──▶ Answer    │
│              │  Upload      Split     Vector    Similarity  Cite        │
│              └─────────────────────┘                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Flow (ingest → chunk → embed → retrieve → answer)

```
                    ┌─────────────────────────────┐
                    │      1. INGEST              │
                    │  User uploads/pastes a      │
                    │  document via Angular UI    │
                    └────────────┬────────────────┘
                                 ▼
                    ┌─────────────────────────────┐
                    │      2. CHUNKING            │
                    │  Text split into overlapping │
                    │  segments (~500 words,       │
                    │  ~50 word overlap)          │
                    └────────────┬────────────────┘
                                 ▼
                    ┌─────────────────────────────┐
                    │      3. EMBEDDING           │
                    │  Each chunk → 100-dim TF-IDF│
                    │  vector via hashing trick   │
                    │  + bigrams, unit-normalized │
                    └────────────┬────────────────┘
                                 ▼
                    ┌─────────────────────────────┐
                    │      4. RETRIEVAL           │
                    │  User question → same       │
                    │  embedding → cosine sim     │
                    │  against all chunk vectors  │
                    └────────────┬────────────────┘
                                 ▼
                    ┌─────────────────────────────┐
                    │      5. ANSWER              │
                    │  Top-k chunks → extractive  │
                    │  synthesis → answer +       │
                    │  citations with scores      │
                    └─────────────────────────────┘
```

---

## Features

- **📄 Document Management** — Create, list, view, and delete documents with title, content, and source metadata
- **🔪 Automatic Chunking** — Documents are split into overlapping chunks (~500 words with ~50 word overlap) for efficient retrieval
- **🧠 Local TF-IDF Embeddings** — Each chunk gets a 100-dimensional vector computed via a hashing trick with unigram + bigram features, unit-normalized
- **🔍 Semantic Search** — Cosine similarity vector search across all chunks, optionally filtered by document
- **💬 AI-Powered Q&A** — Ask natural language questions; the system retrieves relevant chunks and synthesizes an extractive answer with citations
- **📚 Transparent Citations** — Every answer includes source document titles, relevant excerpts, and relevance scores
- **🔐 JWT Authentication** — Register/login flow with bcryptjs password hashing and Passport.js JWT guards
- **🌱 Seed Data** — One-click seeding of 5 educational documents with pre-computed chunks and embeddings
- **🖥 Modern Angular Frontend** — Angular 22 with signals, zoneless change detection, standalone components, Tailwind CSS

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular (standalone, signals) | 22 |
| Frontend Styling | Tailwind CSS | 4 |
| Backend | NestJS | 11 |
| Database ORM | TypeORM | 0.3 |
| Database (dev) | SQLite via better-sqlite3 | 12 |
| Database (prod) | Neon PostgreSQL (pgvector-ready) | — |
| Auth | Passport.js + JWT + bcryptjs | — |
| Embeddings | TF-IDF (hashing trick + bigrams, 100-dim) | — |
| API Docs | Swagger / OpenAPI | — |

---

## Prerequisites

- **Node.js 22** or later
- **npm** (comes with Node.js)

---

## Quick Start

### 1. Clone and install

```bash
cd apps/api && npm install
cd ../web && npm install
cd ../..
```

### 2. Environment variables

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env` — at minimum set `JWT_SECRET` to a random string. The defaults work for local development.

### 3. Start the backend

```bash
cd apps/api
npm run start:dev
```

The API starts at **http://localhost:3000**. Swagger docs at **http://localhost:3000/api/docs**.

### 4. Start the frontend

```bash
cd apps/web
npm start
```

The UI is at **http://localhost:4200**.

### 5. Seed demo data

Navigate to `http://localhost:4200` and click **"Seed Demo Data"** on the homepage (no login required), or:

```bash
curl -X POST http://localhost:3000/seed
```

This creates 5 educational documents with fully chunked and embedded content.

### 6. Register and explore

1. Click **Register** in the navbar
2. Create an account (email, username, password)
3. Browse documents, create new ones, or ask questions

---

## The AI Capability: RAG Pipeline (Rung 4)

This project implements **AI Ladder Rung 4**: a complete **Retrieval-Augmented Generation** pipeline. Here's what each step does:

### Embedding Algorithm

Instead of calling an external API (OpenAI, etc.), the system computes TF-IDF-style embeddings locally:

1. **Tokenization** — Split text into words, lowercased, filtered
2. **Hashing trick** — Each word is hashed into a 100-dimensional bucket using a polynomial hash (`hash * 31 + charCode`)
3. **Bigram features** — Adjacent word pairs are hashed into the same vector with 0.5 weight
4. **Unit normalization** — The vector is divided by its magnitude so cosine similarity works correctly

### Retrieval

When a user asks a question:
1. The question is embedded using the same algorithm
2. Cosine similarity is computed against every chunk embedding
3. Chunks are sorted by similarity, top-K are returned
4. An optional `documentIds` filter restricts search scope

### Answer Synthesis

The answer is **extractive** — it concatenates excerpts from the top 3 most relevant chunks, prefixed with their source document titles. No generative LLM is needed. This means answers are always grounded in actual document content.

### Upgrade Path

- **Real embeddings**: Replace `embedText()` with calls to an embeddings API (OpenAI, Cohere, etc.) and store full vectors
- **LLM-powered answers**: Swap the `synthesizeAnswer()` method for a call to a chat completion API that receives the question + context chunks
- **Vector database**: Replace in-memory cosine similarity with pgvector on Neon for production-scale vector search

---

## Project Structure

```
/
├── .env.example          # Environment variable template
├── .gitignore
├── README.md
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── AI_INTEGRATION.md
│   ├── DECISIONS.md
│   ├── FRONTEND.md
│   └── LEARNINGS.md
├── apps/
│   ├── api/              # NestJS backend
│   │   └── src/
│   │       ├── auth/         # JWT authentication
│   │       ├── documents/    # Document CRUD
│   │       ├── chunks/       # Text chunking
│   │       ├── rag/          # RAG pipeline
│   │       ├── seed/         # Data seeding
│   │       └── common/       # Shared filters
│   └── web/              # Angular frontend
│       └── src/app/
│           ├── pages/        # Route pages
│           ├── components/   # Shared components
│           ├── services/     # API clients
│           └── interceptors/ # HTTP interceptor
```

---

## Roadmap

- [ ] **Real embeddings**: Integrate OpenAI / Cohere embeddings API
- [ ] **LLM answer generation**: Swap extractive synthesis for GPT/Claude-powered answers
- [ ] **Neon production deployment**: Migrate from SQLite to Neon PostgreSQL with pgvector
- [ ] **File upload**: Support PDF, DOCX, and plain text file upload
- [ ] **Document editing**: Update document content with automatic re-chunking
- [ ] **Search history persistence**: Store query history in the database
- [ ] **Multi-user document isolation**: Scope documents to the user who created them
- [ ] **Paginated document list**: Handle large document collections
- [ ] **Dark mode**: Tailwind-based theme toggle
