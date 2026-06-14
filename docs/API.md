# API Reference

**Base URL**: `http://localhost:3000`  
**Swagger UI**: `http://localhost:3000/api/docs`

All endpoints except `POST /auth/register`, `POST /auth/login`, and `POST /seed` require authentication via Bearer JWT token.

---

## Authentication Header

```
Authorization: Bearer <token>
```

The token is a JWT returned by `POST /auth/register` or `POST /auth/login`. It expires in **7 days**.

---

## Error Response Format

All errors follow a consistent structure:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2026-06-14T12:00:00.000Z",
  "path": "/auth/me"
}
```

Validation errors (400) return an array of messages:

```json
{
  "statusCode": 400,
  "message": [
    "title must be a string",
    "source must be one of the following values: upload, paste, url"
  ],
  "timestamp": "2026-06-14T12:00:00.000Z",
  "path": "/documents"
}
```

Common status codes:
- `200` — Success
- `201` — Created
- `204` — Deleted (no content)
- `400` — Validation error (malformed request body)
- `401` — Missing or invalid JWT
- `404` — Resource not found
- `409` — Conflict (duplicate email/username)

---

## Auth Endpoints

### POST /auth/register

Register a new user account.

**Request:**

```json
{
  "email": "alice@example.com",
  "username": "alice",
  "password": "mySecurePass123"
}
```

**Validation:**
- `email` — valid email format, max 255 chars
- `username` — 3-30 characters
- `password` — 6-128 characters

**Response (201):**

```json
{
  "token": "eyJhbG...VCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "username": "alice",
    "createdAt": "2026-06-14T12:00:00.000Z"
  }
}
```

**Error (409):**

```json
{
  "statusCode": 409,
  "message": "Email already registered",
  "timestamp": "2026-06-14T12:00:00.000Z",
  "path": "/auth/register"
}
```

### POST /auth/login

Authenticate with email and password.

**Request:**

```json
{
  "email": "alice@example.com",
  "password": "mySecurePass123"
}
```

**Response (200):**

```json
{
  "token": "eyJhbG...VCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "username": "alice",
    "createdAt": "2026-06-14T12:00:00.000Z"
  }
}
```

**Error (401):**

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "timestamp": "2026-06-14T12:00:00.000Z",
  "path": "/auth/login"
}
```

### GET /auth/me

Get the currently authenticated user's profile.

**Headers:** `Authorization: Bearer ***``

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alice@example.com",
  "username": "alice",
  "password": "$2a$10$...",
  "createdAt": "2026-06-14T12:00:00.000Z"
}
```

> **Note:** The raw `password` field is returned by NestJS serialization. This is safe for local development but should be excluded via a serializer/transformer interceptor in production.

---

## Document Endpoints

All require `Authorization: Bearer <token>`.

### POST /documents

Create a new document. The document is saved but **not automatically chunked** — you must call the rechunk endpoint or use the seed endpoint.

**Request:**

```json
{
  "title": "Introduction to Angular Signals",
  "content": "Angular Signals represent a revolutionary shift in how Angular handles reactivity and change detection. Introduced in Angular 16 as a developer preview and stabilized in Angular 17, Signals provide a new primitive for managing state changes in Angular applications...",
  "source": "paste"
}
```

**Valid `source` values:** `upload`, `paste`, `url`

**Response (201):**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Introduction to Angular Signals",
  "content": "Angular Signals represent a revolutionary shift...",
  "source": "paste",
  "metadata": null,
  "userId": null,
  "createdAt": "2026-06-14T12:00:00.000Z",
  "updatedAt": "2026-06-14T12:00:00.000Z"
}
```

### GET /documents

List all documents, ordered by most recent first.

**Response (200):**

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Introduction to Angular Signals",
    "content": "Angular Signals represent a revolutionary shift...",
    "source": "paste",
    "metadata": null,
    "userId": null,
    "createdAt": "2026-06-14T12:00:00.000Z",
    "updatedAt": "2026-06-14T12:00:00.000Z"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "title": "NestJS Architecture Patterns",
    "content": "NestJS has emerged as one of the most popular...",
    "source": "paste",
    "metadata": null,
    "userId": null,
    "createdAt": "2026-06-14T11:00:00.000Z",
    "updatedAt": "2026-06-14T11:00:00.000Z"
  }
]
```

### GET /documents/:id

Get a single document by UUID.

**Response (200):**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "title": "Introduction to Angular Signals",
  "content": "Angular Signals represent a revolutionary shift...",
  "source": "paste",
  "metadata": null,
  "userId": null,
  "createdAt": "2026-06-14T12:00:00.000Z",
  "updatedAt": "2026-06-14T12:00:00.000Z"
}
```

**Error (404):**

```json
{
  "statusCode": 404,
  "message": "Document with id 99999999-... not found",
  "timestamp": "2026-06-14T12:00:00.000Z",
  "path": "/documents/99999999-..."
}
```

### DELETE /documents/:id

Delete a document and all its chunks (CASCADE).

**Response:** `204 No Content` (no body)

**Error (404):** Same format as above.

---

## Chunk Endpoints

All require `Authorization: Bearer <token>`.

### GET /documents/:documentId/chunks

Get all chunks for a specific document, ordered by `chunkIndex`.

**Response (200):**

```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440010",
    "documentId": "660e8400-e29b-41d4-a716-446655440001",
    "content": "Angular Signals represent a revolutionary shift in how Angular handles reactivity and change detection...",
    "chunkIndex": 0,
    "tokenCount": 120,
    "embedding": "[0.021, -0.045, 0.012, ...]",
    "createdAt": "2026-06-14T12:00:00.000Z",
    "document": { "id": "...", "title": "Introduction to Angular Signals", ... }
  },
  {
    "id": "990e8400-e29b-41d4-a716-446655440011",
    "documentId": "660e8400-e29b-41d4-a716-446655440001",
    "content": "The Signal API is deceptively simple. You create a signal using the signal() function: const count = signal(0)...",
    "chunkIndex": 1,
    "tokenCount": 115,
    "embedding": "[0.033, -0.012, 0.078, ...]",
    "createdAt": "2026-06-14T12:00:00.000Z",
    "document": { ... }
  }
]
```

### POST /documents/:documentId/chunks/rechunk

Delete all existing chunks for the document, re-split the content into overlapping chunks, and return the new chunks.

**Response (200):**

```json
[
  {
    "id": "new-uuid-1",
    "documentId": "660e8400-e29b-41d4-a716-446655440001",
    "content": "Angular Signals represent a revolutionary shift...",
    "chunkIndex": 0,
    "tokenCount": 120,
    "embedding": "[0.021, -0.045, 0.012, ...]",
    "createdAt": "2026-06-14T12:05:00.000Z",
    "document": { ... }
  }
]
```

> **Note:** The current implementation of `rechunk()` in `ChunksService` does not regenerate embeddings after chunking. Embeddings are only computed in the seed service. A future improvement should call `RagService.embedText()` on each new chunk after re-chunking.

---

## RAG Query Endpoint

### POST /rag/query

Submit a natural language question and retrieve an answer synthesized from the most relevant document chunks.

**Headers:** `Authorization: Bearer ***``

**Request:**

```json
{
  "question": "What are Angular Signals and how do they work?",
  "documentIds": ["660e8400-e29b-41d4-a716-446655440001"],
  "topK": 5
}
```

**Parameters:**
- `question` (string, required) — The natural language question
- `documentIds` (string[], optional) — Restrict search to specific documents by UUID
- `topK` (number, optional, default: 5, min: 1) — Number of top chunks to retrieve

**Response (200):**

```json
{
  "question": "What are Angular Signals and how do they work?",
  "answer": "Based on the retrieved information from Introduction to Angular Signals:\n\nAngular Signals represent a revolutionary shift in how Angular handles reactivity and change detection. Introduced in Angular 16 as a developer preview and stabilized in Angular 17, Signals provide a new primitive for managing state changes in Angular applications.\n\n---\n\nThe Signal API is deceptively simple. You create a signal using the signal() function: const count = signal(0). To read the value, you call count(). To update it, you use count.set(5) or count.update(v => v + 1).",
  "citations": [
    {
      "chunkId": "880e8400-e29b-41d4-a716-446655440010",
      "documentTitle": "Introduction to Angular Signals",
      "excerpt": "Angular Signals represent a revolutionary shift in how Angular handles reactivity and change detection. Introduced in Angular 16 as a developer preview and stabilized in Angular 17...",
      "relevanceScore": 0.892
    },
    {
      "chunkId": "990e8400-e29b-41d4-a716-446655440011",
      "documentTitle": "Introduction to Angular Signals",
      "excerpt": "The Signal API is deceptively simple. You create a signal using the signal() function: const count = signal(0). To read the value, you call count()...",
      "relevanceScore": 0.731
    },
    {
      "chunkId": "101-e8400-e29b-41d4-a716-446655440012",
      "documentTitle": "Introduction to Angular Signals",
      "excerpt": "Effects are another crucial concept: effect(() => console.log('Count:', count())). Effects run whenever their signal dependencies change...",
      "relevanceScore": 0.654
    }
  ]
}
```

**Edge cases:**
- **No relevant chunks found:** Returns `"No relevant information found to answer this question."` with an empty citations array
- **Empty question:** Returns a validation error (400)
- **No documents seeded:** Returns the "no relevant info" message since no chunks have embeddings
- **Invalid documentIds:** Silently filters out non-existent document IDs (only chunks matching valid docs are returned)

---

## Seed Endpoint

### POST /seed

Seed the database with 5 educational documents (Angular Signals, NestJS, Neon/pgvector, TypeScript, Machine Learning). Each document is chunked and embedded. Clears existing data first.

**Authentication:** Not required (public endpoint for demo convenience).

**Response (200):**

```json
{
  "message": "Database seeded successfully",
  "documentCount": 5,
  "chunkCount": 18
}
```
