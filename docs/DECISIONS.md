# Architecture Decisions

This document records non-obvious decisions made during the design and implementation of the RAG Knowledge Base project. Each entry follows an ADR (Architecture Decision Record) style.

---

## ADR-001: TF-IDF via Hashing Trick Instead of Real Embeddings

**Status:** Accepted  
**Date:** 2026-06-14

### Context

The project needed to embed document chunks into vectors for similarity search. Standard RAG systems use embeddings from OpenAI, Cohere, or Sentence Transformers. However:
- We wanted zero external API dependencies
- The application should work fully offline
- No API keys should be required to run the project

### Decision

Implement TF-IDF-style embeddings using a hashing trick:

1. Split text into words (lowercased, alphanumeric only)
2. Hash each word into a 100-dimension bucket using polynomial rolling hash
3. Hash bigrams (adjacent word pairs) with half weight
4. Unit-normalize the resulting vector

### Consequences

**Positive:**
- Zero external dependencies — works completely offline
- No API costs — embedding is CPU-only and fast (microseconds per chunk)
- Simple to understand and debug — the embedding is deterministic
- Full control over the algorithm

**Negative:**
- 100 dimensions is far less expressive than 768–1536 dimensions of real embeddings
- The hashing trick loses word frequency information (no actual TF-IDF weighting)
- No semantic understanding — "bank" (river) and "bank" (financial) hash to the same bucket
- Bigrams provide only shallow phrase awareness

### Alternatives Considered

- **OpenAI embeddings API:** Best quality but requires API key and internet
- **Sentence Transformers (local):** Requires downloading large model files (~500MB+), complex setup
- **word2vec/GloVe:** Requires pre-trained model files and more complex loading

---

## ADR-002: SQLite Instead of Neon (PostgreSQL + pgvector)

**Status:** Accepted  
**Date:** 2026-06-14

### Context

The ideal production database for a RAG application is Neon (serverless PostgreSQL) with the pgvector extension for native vector similarity search. However:
- Setting up a Neon account and database is an extra onboarding step
- We wanted "clone and run" simplicity for local development
- The project may be deployed by users without a Neon account

### Decision

Use SQLite via `better-sqlite3` for local development, with TypeORM as the abstraction layer to make the Neon migration straightforward. Embeddings are stored as JSON strings in a `TEXT` column.

### Consequences

**Positive:**
- Zero-config database — no server, no accounts, no connection strings
- SQLite is fast for single-user development
- TypeORM provides a clean migration path to PostgreSQL
- The database file (`data/knowledge.db`) is portable and easy to backup

**Negative:**
- No native vector type — embeddings are stored as JSON strings (inefficient serialization/deserialization)
- Similarity search requires loading all chunks into memory and computing cosine similarity in Node.js (doesn't scale)
- SQLite has limited concurrency (single writer)

### Migration Path

See `docs/DATABASE.md` for the exact migration steps. Key changes:
1. Switch TypeORM driver from `better-sqlite3` to `postgres`
2. Run `CREATE EXTENSION vector;` in Neon
3. Add a `vector(100)` column alongside or replacing the `TEXT` embedding column
4. Use SQL `ORDER BY embedding <=> $1` for similarity search

---

## ADR-003: Signal-First Angular 22 (Zoneless, No @Input/@Output)

**Status:** Accepted  
**Date:** 2026-06-14

### Context

Angular 22 introduced final, stable APIs for signals and zoneless change detection. The frontend was designed to use the latest Angular features and best practices.

### Decision

Use Angular 22 with:
- **Signals** for all component state (`const count = signal(0)`)
- **Computed signals** for derived state (`const isEmpty = computed(...)`)
- **No `@Input()` or `@Output()` decorators** — components are standalone and receive data through services and route parameters
- **Zoneless change detection** via `provideZoneChangeDetection({ eventCoalescing: true })`
- **New control flow** — `@if`, `@for`, `@defer` instead of `*ngIf`, `*ngFor`
- **Tailwind CSS 4** for all styling — no component CSS files

### Consequences

**Positive:**
- Predictable, push-based reactivity — components only update when their signals change
- Significantly less boilerplate than RxJS-only state management
- No change detection issues — signals are automatically tracked
- Smaller bundle size without zone.js overhead
- Modern Angular patterns that align with the framework's future direction

**Negative:**
- Steeper learning curve for developers familiar with classic Angular (NgModules, zone.js)
- Some patterns (form state from signals) are still evolving
- `provideZoneChangeDetection` is still present for compatibility with some Angular internals

### Component Structure

Every page follows this pattern:
```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [/* only what this component uses */],
  template: `<app-navbar /> ...`,
})
export class ExampleComponent {
  // State
  protected data = signal<Data | null>(null);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  // Derived
  protected isEmpty = computed(() => !this.loading() && this.data() === null);

  constructor() {
    // Load data
  }
}
```

---

## ADR-004: NestJS Feature Module Organization

**Status:** Accepted  
**Date:** 2026-06-14

### Context

The backend has five distinct domains: auth, documents, chunks, RAG, and seed. NestJS modules provide natural boundaries between these domains.

### Decision

Organize code into feature modules following NestJS conventions:

```
src/
├── auth/           # AuthModule — auth.controller, auth.service, JwtStrategy, guards, DTOs, user.entity
├── documents/      # DocumentsModule — CRUD controller, service, DTOs, document.entity
├── chunks/         # ChunksModule — chunking service, controller, chunk.entity
├── rag/            # RagModule — query endpoint, embedding service, DTOs
├── seed/           # SeedModule — one-shot data seeding
└── common/         # Shared exception filter
```

**Key patterns:**
- Each module registers its own TypeORM entities via `TypeOrmModule.forFeature()`
- The `RagModule` exports `RagService` so `SeedModule` can use it for embedding
- `DocumentsModule` and `ChunksModule` are independent (no cross-imports)
- The global `ValidationPipe` and `HttpExceptionFilter` are registered in `main.ts`

### Consequences

**Positive:**
- Clear separation of concerns — each module handles one domain
- Easy to test modules in isolation
- Swagger decorators (`@ApiTags`, `@ApiOperation`) auto-group endpoints
- Following NestJS conventions means any NestJS developer can navigate the code

**Negative:**
- Some cross-module boundaries are blurry (e.g., `RagModule` depends on `Chunk` and `Document` entities directly instead of importing services)
- The seed module duplicates chunking logic from `ChunksService`

---

## ADR-005: Extractive Answer Synthesis Instead of Generative

**Status:** Accepted  
**Date:** 2026-06-14

### Context

After retrieving relevant chunks, the system needs to produce an answer. Two approaches: extractive (concatenate excerpts) or generative (use an LLM to rewrite).

### Decision

Use extractive answer synthesis:

```typescript
private synthesizeAnswer(question: string, chunks: Chunk[]): string {
  const documentTitles = /* ... */;
  const excerpts = chunks.map(c => c.content.substring(0, 300));
  return [
    `Based on the retrieved information from ${documentTitles}:`,
    '',
    excerpts.join('\n\n---\n\n'),
  ].join('\n');
}
```

### Consequences

**Positive:**
- Every word in the answer is directly from a source document — zero hallucination risk
- No API costs, no latency from external calls
- Works offline
- Citations are inherently accurate since the answer is literally the source text

**Negative:**
- Answers can be awkward — raw concatenation of excerpts without natural language flow
- No summarization — the answer length equals the excerpt lengths
- Cannot answer questions that require synthesis across multiple documents (e.g., "compare X and Y")

### Upgrade Path

The `synthesizeAnswer()` method is designed to be cleanly replaced with a generative approach when an LLM API key is available. See `docs/AI_INTEGRATION.md` for the replacement code.
