# AI Integration

## AI Ladder: Rung 4 — Full RAG Pipeline

This project implements **Rung 4** of the AI Ladder framework:

| Rung | Capability | Status |
|------|-----------|--------|
| 1 | Collect / Ingest data | ✅ Upload via UI |
| 2 | Chunk / Structure data | ✅ 500-word overlapping chunks |
| 3 | Embed / Index data | ✅ TF-IDF 100-dim vectors |
| **4** | **Retrieve + Answer** | ✅ **Cosine similarity + extractive answer** |
| 5 | LLM-powered generation | ⬜ Future (drop-in upgrade) |
| 6 | Feedback & fine-tuning | ⬜ Future |

The system runs a complete RAG pipeline **without any external AI API calls**. All computation happens locally in Node.js.

---

## Embedding Algorithm

The `RagService.embedText()` method implements a TF-IDF-style vectorizer using a hashing trick. Here is the full algorithm:

### Step 1: Tokenization

```typescript
const lower = text.toLowerCase();
const words = lower.split(/[^a-z0-9]+/).filter((w) => w.length > 0);
```

- Converts to lowercase
- Splits on non-alphanumeric characters
- Filters out empty strings

### Step 2: Unigram Hashing

```typescript
for (const word of words) {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = (hash * 31 + word.charCodeAt(i)) & 0x7fffffff;
  }
  const index = hash % DIMENSION;  // 100
  vector[index] += 1;
}
```

Each word is hashed using a polynomial rolling hash (`hash * 31 + charCode`) constrained to 31-bit positive integers. The hash is modulo 100 to produce a dimension index, and the corresponding bucket is incremented. This is a **count-based** approach (not TF-IDF weighted), but it works adequately for small document collections.

### Step 3: Bigram Features

```typescript
for (let i = 0; i < words.length - 1; i++) {
  const bigram = words[i] + '_' + words[i + 1];
  // same hash function
  const index = hash % DIMENSION;
  vector[index] += 0.5;  // Lower weight for bigrams
}
```

Adjacent word pairs (bigrams) are hashed into the same vector with **half the weight** of unigrams. This captures some phrase-level semantics — for example, "machine learning" gets a different hash bucket than "machine" and "learning" separately.

### Step 4: Unit Normalization

```typescript
const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
if (magnitude > 0) {
  for (let i = 0; i < DIMENSION; i++) {
    vector[i] /= magnitude;
  }
}
```

The vector is divided by its Euclidean magnitude. This ensures cosine similarity works correctly — two unit vectors have a cosine of 1 when identical, 0 when orthogonal, and -1 when opposite. Empty text produces a zero vector (all zeros).

### Why 100 dimensions?

100 dimensions is a tradeoff between:
- **Discriminative power** — Too few dimensions cause hash collisions (different words mapping to the same bucket). Too many make the vectors sparse and slow to compare.
- **Performance** — 100-dim vectors are small (800 bytes each as JSON) and fast to compute cosine similarity on

For real production use with pgvector, you would typically use 768–1536 dimensions (OpenAI ada-002 uses 1536; many open-source models use 768).

---

## Similarity Search

### Cosine Similarity

```typescript
cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0, magnitudeA = 0, magnitudeB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  const denom = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  if (denom === 0) return 0;
  return dotProduct / denom;
}
```

Since all embeddings are unit-normalized, the cosine similarity is equivalent to the dot product. The function still computes magnitudes for safety (some chunks may have zero embeddings).

### Retrieval Flow

1. **Embed question** using the same algorithm
2. **Load all chunks** from the database that have non-null, non-empty embeddings
3. **Optional document filter** — use `documentIds` to restrict which chunks are loaded
4. **Score each chunk** — compute `cosineSimilarity(questionVector, chunkEmbedding)`
5. **Filter by score > 0** — discard chunks with zero or negative similarity
6. **Sort by score descending**, take top-K
7. **Return chunks** with their metadata

Current limitation: All chunks with embeddings are loaded into memory and scored sequentially. This works for small datasets (<10K chunks) but doesn't scale. For production, you would use pgvector's `ORDER BY embedding <=> $1 LIMIT $2` with an HNSW index for approximate nearest neighbor search.

---

## Answer Synthesis

The `synthesizeAnswer()` method uses a purely **extractive** approach:

```typescript
private synthesizeAnswer(question: string, chunks: Chunk[]): string {
  const documentTitles = Array.from(
    new Set(chunks.map((c) => c.document?.title).filter(Boolean)),
  );

  const excerpts = chunks.map(
    (c) => c.content.substring(0, 300),
  );

  // Build answer string
  return [
    `Based on the retrieved information${documentTitles.length > 0 ? ` from ${documentTitles.join(', ')}` : ''}:`,
    '',
    excerpts.join('\n\n---\n\n'),
  ].join('\n');
}
```

This produces answers like:

> Based on the retrieved information from Introduction to Angular Signals:
>
> Angular Signals represent a revolutionary shift in how Angular handles reactivity...

Key design decisions:
- **No generation**, just assembly — guarantees 100% factual grounding
- **Top 3 chunks** are included in the answer body
- **All top-K chunks** are included as citations with relevance scores
- Excerpts are truncated to 200 characters in citations, 300 in the answer body

### Failure Modes

| Scenario | Behavior |
|----------|----------|
| **Empty query** | ValidationPipe rejects with 400 |
| **No chunks found** | Returns `"No relevant information found..."` with empty citations |
| **No documents seeded** | Same as above — no chunks have embeddings |
| **Low-relevance question** | All cosine scores will be low, but the best available chunks are still returned with their actual scores |
| **Question outside document scope** | The answer will be the most thematically similar chunks, which may be irrelevant — this is an unavoidable limitation of any RAG system when the knowledge base lacks the relevant information |

---

## Upgrade Path to Real LLM + pgvector

### 1. Replace embeddings

Swap `RagService.embedText()` with a call to an embeddings API:

```typescript
async embedText(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',  // 1536 dimensions
    }),
  });
  const data = await response.json();
  return data.data[0].embedding;
}
```

### 2. Switch to pgvector

Change the TypeORM configuration to use Neon PostgreSQL and change the `embedding` column type to `vector(1536)`. Use native SQL operators for similarity search.

### 3. LLM-powered answer generation

Replace `synthesizeAnswer()` with a call to a chat completion API:

```typescript
async synthesizeAnswer(question: string, chunks: Chunk[]): Promise<string> {
  const context = chunks.map(c => `[${c.document?.title}]\n${c.content}`).join('\n\n');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { /* ... */ },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Answer based on the provided context.' },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
      ],
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content;
}
```
