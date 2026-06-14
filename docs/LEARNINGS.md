# Learnings

This document captures what the project taught us, pain points encountered, and how they were solved. It's intended for future developers maintaining or extending the codebase.

---

## What This Project Taught

### 1. TF-IDF Embeddings from Scratch

Building a vectorizer without an ML library taught us how embeddings actually work under the hood:

- **The hashing trick is lossy but fast.** Multiple words can collide into the same bucket, which is fine for small collections but becomes a problem at scale. We solved this by adding bigram features with separate hashing, which provides more discriminative power.
- **Unit normalization is critical.** Without it, documents with more words would always score higher in cosine similarity regardless of semantic relevance.
- **Bigrams capture phrase boundaries.** "New York" hashed as `new_york` gets a different bucket than `new` and `york` separately, which helps distinguish "York University" from "University of New York."
- **100 dimensions is a guess.** We picked 100 as a round number that seemed reasonable. Testing showed that 50 dimensions caused too many collisions, while 200 dimensions made the vectors too sparse for a small corpus. The right answer depends on your vocabulary size and document count.

### 2. RAG Pipeline Architecture

Implementing the full ingest → chunk → embed → retrieve → answer pipeline revealed several architectural insights:

- **The pipeline is naturally sequential but each stage is independently replaceable.** You can swap the chunking strategy without touching the embedding code, or replace embeddings without touching retrieval.
- **Embeddings must be computed at chunk-creation time, not query time.** Pre-computing embeddings and storing them in the database turns query-time O(n) embedding computation into O(n) similarity computation against already-embedded chunks. The tradeoff is storage space — embeddings take up 800 bytes each as JSON strings.
- **The retrieval quality is only as good as the chunking strategy.** Our 500-word chunks with 50-word overlap work well for English prose but would be terrible for code snippets or structured data. Different content types need different chunking strategies.

### 3. Chunking Strategies

- **500 words (~2 minutes of reading) is a good default for prose.** It's long enough to contain complete thoughts but short enough to be semantically focused.
- **Overlap matters for continuity.** The 50-word overlap (10%) ensures that concepts spanning the chunk boundary appear in both chunks, so retrieval won't miss them regardless of which side of the boundary they fall.
- **Word-based splitting is naive.** We split on whitespace after stripping non-alphanumeric characters. This breaks on:
  - Code: `functionName(param)` becomes `functionName param`
  - URLs: `https://example.com/page` becomes `https example com page`
  - Punctuation-dependent meaning: "Let's eat, Grandma!" vs "Let's eat Grandma!"
- **A production system would use sentence splitting** (via NLTK, spaCy, or a simple regex) to avoid breaking in the middle of a sentence.

---

## Pain Points and Solutions

### Pain Point 1: Embedding Storage in SQLite

**Problem:** SQLite has no native vector type. Storing embeddings as JSON strings in a `TEXT` column means every similarity search requires:
1. Loading all chunks from the database
2. Parsing each JSON string back into an array
3. Computing cosine similarity in Node.js

This is fine for hundreds of chunks but would be painfully slow at thousands or millions.

**Solution:** We kept the design Neon-ready. The `embedding` column is text for SQLite but maps to `vector(100)` in Neon/pgvector. The migration is a SQL script change, not a code change. For now, the performance is adequate — 18 seed chunks plus any user-uploaded documents are well within the limit.

### Pain Point 2: RAG Service Duplicates Chunking Logic

**Problem:** The `SeedService` has its own chunking logic that duplicates the `ChunksService.createChunks()`. Worse, the seed service also computes embeddings for each chunk, while `ChunksService.rechunk()` does not.

```
SeedService.chunkDocument()  ← copies logic from ChunksService
SeedService.embedChunks()    ← only place embeddings are computed
ChunksService.rechunk()      ← creates chunks but does NOT compute embeddings
```

This means calling `POST /documents/:id/chunks/rechunk` from the UI creates new chunks without embeddings, so those chunks are invisible to the RAG pipeline.

**Solution (recommended):** Refactor `ChunksService.rechunk()` to also call `RagService.embedText()` on each new chunk. Then have `SeedService` delegate to `ChunksService` for chunking instead of duplicating the logic.

### Pain Point 3: Document and Chunk ID Types

**Problem:** The backend uses UUID strings for IDs (`crypto.randomUUID()`), but the frontend TypeScript interfaces define IDs as `number`:

```typescript
// Frontend
export interface Document {
  id: number;      // ← should be string
  // ...
}
```

This works because JavaScript JSON parsing doesn't enforce the type, but it's misleading and will fail if someone tries to use `typeof id === 'number'` anywhere. The `QueryComponent` also calls `Number(documentFilter)` when passing a document filter, which won't work with UUID strings.

**Solution:** Update the frontend interfaces to use `string` for all ID types.

### Pain Point 4: No Automatic Chunking After Document Creation

**Problem:** `POST /documents` creates a document but does not automatically chunk it or compute embeddings. Users must either:
- Call `POST /seed` (which chunks + embeds 5 hardcoded documents)
- Manually call `POST /documents/:id/chunks/rechunk` (which chunks without embeddings)

A user uploading a document through the UI won't see any results in the query page until they also trigger rechunking.

**Solution:** Add automatic chunking and embedding in the document creation flow. The `DocumentsService.create()` method should call `ChunksService.chunkDocument()` and then `RagService.embedText()` for each chunk.

### Pain Point 5: Search History Is Frontend-Only

**Problem:** The `SearchHistoryComponent` calls `GET /rag/history`, but there's no backend endpoint for this. The `RagService` frontend defines the interface and endpoint, but the backend `RagController` has no matching route. Search history is not persisted anywhere.

**Solution:** Either:
- Remove the search history route and feature from the frontend until it's implemented
- Or implement the backend: create a `QueryHistory` entity, a `POST /rag/history` endpoint that saves queries, and a `GET /rag/history` endpoint that returns them

### Pain Point 6: No User-Document Association

**Problem:** The `document.userId` field exists but is never set. All documents are visible to all users. This is fine for a demo but makes multi-user scenarios impossible.

**Solution:** Set `userId` on document creation from the authenticated user's JWT payload. Filter documents by `userId` in `GET /documents` when the user is authenticated.

---

## Key Takeaways

1. **Start simple, upgrade later.** The local TF-IDF approach let us build and test the entire RAG pipeline without any external dependencies. Adding real embeddings later is a clean swap.
2. **TypeORM with synchronize is great for prototyping, dangerous for production.** The automatic schema synchronization is incredibly fast for development but a migration system is essential for production.
3. **Signals make Angular state management trivial.** We didn't need NgRx, Akita, or any state management library. `signal()` + `computed()` + services was enough for the entire application.
4. **The extractive answer approach is underrated.** For internal knowledge bases where accuracy matters more than fluency, extractive answers with explicit citations may actually be better than LLM-generated answers that might hallucinate.
5. **Documentation-as-code works.** Writing these docs forced us to identify and document the pain points above. Without documentation, they would remain invisible until someone encountered them.
