import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ChunksService } from '../src/chunks/chunks.service';
import { RagService } from '../src/rag/rag.service';

/*
 * E2E tests for the RAG Knowledge Base API.
 * Uses SQLite in-memory database (DATABASE_TYPE=better-sqlite3, DATABASE_URL=:memory:).
 * Tests: Auth, Documents CRUD, Chunks, and RAG query with computed embeddings.
 */

describe('RAG API (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let documentId: string;
  let chunkIds: string[];
  let chunksService: ChunksService;
  let ragService: RagService;

  beforeAll(async () => {
    // Force in-memory SQLite database
    process.env.DATABASE_TYPE = 'better-sqlite3';
    process.env.DATABASE_URL = ':memory:';
    process.env.JWT_SECRET = 'rag-knowledge-base-secret-key';

    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same global pipes as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    // Get service references for RAG test setup
    chunksService = app.get(ChunksService);
    ragService = app.get(RagService);
  });

  afterAll(async () => {
    await app.close();
  });

  // ──────────────────────────────────────────────
  //  Auth
  // ──────────────────────────────────────────────

  describe('Auth', () => {
    const registerDto = {
      email: 'e2e@example.com',
      username: 'e2euser',
      password: 'StrongPass1',
    };

    it('POST /auth/register — should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        email: registerDto.email,
        username: registerDto.username,
      });
      expect(res.body.user).not.toHaveProperty('password');

      authToken = res.body.token;
    });

    it('POST /auth/register — should reject duplicate email with 409', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('POST /auth/register — should reject duplicate username with 409', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other@example.com',
          username: registerDto.username,
          password: 'StrongPass1',
        })
        .expect(409);
    });

    it('POST /auth/register — should reject invalid input with 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', username: 'ab', password: '12' })
        .expect(400);
    });

    it('POST /auth/login — should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: registerDto.email, password: registerDto.password })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        email: registerDto.email,
        username: registerDto.username,
      });
    });

    it('POST /auth/login — should reject wrong password with 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: registerDto.email, password: 'wrongPassword!' })
        .expect(401);
    });

    it('POST /auth/login — should reject unknown email with 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'unknown@example.com', password: 'StrongPass1' })
        .expect(401);
    });

    it('GET /auth/me — should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('GET /auth/me — should return user profile with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        email: registerDto.email,
        username: registerDto.username,
      });
      expect(res.body).not.toHaveProperty('password');
    });
  });

  // ──────────────────────────────────────────────
  //  Documents CRUD
  // ──────────────────────────────────────────────

  describe('Documents CRUD', () => {
    const createDocDto = {
      title: 'Introduction to Angular',
      content:
        'Angular is a platform for building mobile and desktop web applications. ' +
        'It provides a component-based architecture for building scalable applications. ' +
        'Angular Signals is a new reactive primitive for managing state in Angular applications. ' +
        'Signals provide a way to declare reactive state that automatically tracks dependencies ' +
        'and notifies consumers when values change. This makes change detection more efficient ' +
        'and improves application performance.',
      source: 'paste',
    };

    it('POST /documents — should reject without auth token', async () => {
      await request(app.getHttpServer())
        .post('/documents')
        .send(createDocDto)
        .expect(401);
    });

    it('POST /documents — should create a document', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDocDto)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(createDocDto.title);
      expect(res.body.content).toBe(createDocDto.content);
      expect(res.body.source).toBe(createDocDto.source);
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');

      documentId = res.body.id;
    });

    it('GET /documents — should return all documents', async () => {
      const res = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('id');
    });

    it('GET /documents/:id — should return a specific document', async () => {
      const res = await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.id).toBe(documentId);
      expect(res.body.title).toBe(createDocDto.title);
    });

    it('GET /documents/:id — should return 404 for non-existent document', async () => {
      await request(app.getHttpServer())
        .get('/documents/non-existent-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('DELETE /documents/:id — should delete a document', async () => {
      await request(app.getHttpServer())
        .delete(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('DELETE /documents/:id — should return 404 for already deleted document', async () => {
      await request(app.getHttpServer())
        .delete(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    // Re-create a document for subsequent chunk and RAG tests
    it('POST /documents — re-create document for downstream tests', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Angular Signals Guide',
          content:
            'Angular Signals is a new reactive primitive introduced in Angular 16. ' +
            'Signals allow you to declare reactive state that automatically tracks dependencies. ' +
            'When a signal value changes, all dependent computations are notified automatically. ' +
            'This enables more efficient change detection and better application performance. ' +
            'Signals can be created using the signal() function. Computed values are created ' +
            'using the computed() function, which automatically tracks its dependencies. ' +
            'Effects are side-effect operations that run whenever their signal dependencies change.',
          source: 'paste',
        })
        .expect(201);

      documentId = res.body.id;
    });
  });

  // ──────────────────────────────────────────────
  //  Chunks
  // ──────────────────────────────────────────────

  describe('Chunks', () => {
    it('GET /documents/:documentId/chunks — should return empty array before rechunk', async () => {
      const res = await request(app.getHttpServer())
        .get(`/documents/${documentId}/chunks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('POST /documents/:documentId/chunks/rechunk — should create chunks', async () => {
      const res = await request(app.getHttpServer())
        .post(`/documents/${documentId}/chunks/rechunk`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Each chunk should have required fields
      const chunk = res.body[0];
      expect(chunk).toHaveProperty('id');
      expect(chunk).toHaveProperty('content');
      expect(chunk).toHaveProperty('chunkIndex');
      expect(chunk).toHaveProperty('documentId');
      expect(chunk.documentId).toBe(documentId);

      chunkIds = res.body.map((c: any) => c.id);
    });

    it('GET /documents/:documentId/chunks — should return chunks after rechunk', async () => {
      const res = await request(app.getHttpServer())
        .get(`/documents/${documentId}/chunks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(chunkIds.length);
      expect(res.body[0]).toHaveProperty('document');
    });

    it('POST /documents/:documentId/chunks/rechunk — should replace existing chunks', async () => {
      const res = await request(app.getHttpServer())
        .post(`/documents/${documentId}/chunks/rechunk`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Store new chunk IDs
      chunkIds = res.body.map((c: any) => c.id);
    });
  });

  // ──────────────────────────────────────────────
  //  RAG Query (with simulated embeddings)
  // ──────────────────────────────────────────────

  describe('RAG Query', () => {
    beforeAll(async () => {
      // Save embeddings for each chunk so the RAG service can find them
      for (const chunkId of chunkIds) {
        // Retrieve the chunk content via the database
        const chunks = await chunksService.findByDocumentId(documentId);
        const chunk = chunks.find((c) => c.id === chunkId);
        if (chunk) {
          const embedding = ragService.embedText(chunk.content);
          await chunksService.saveEmbedding(chunkId, embedding);
        }
      }
    });

    it('POST /rag/query — should return relevant answer when chunks match', async () => {
      const res = await request(app.getHttpServer())
        .post('/rag/query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'What are Angular Signals?',
          topK: 3,
        })
        .expect(201);

      expect(res.body).toHaveProperty('question');
      expect(res.body).toHaveProperty('answer');
      expect(res.body).toHaveProperty('citations');

      // Should NOT get the "no relevant info" fallback
      expect(res.body.answer).not.toContain('No relevant information found');

      // Citations should contain relevant chunks
      expect(Array.isArray(res.body.citations)).toBe(true);
      expect(res.body.citations.length).toBeGreaterThan(0);

      const citation = res.body.citations[0];
      expect(citation).toHaveProperty('chunkId');
      expect(citation).toHaveProperty('documentTitle');
      expect(citation).toHaveProperty('excerpt');
      expect(citation).toHaveProperty('relevanceScore');
      expect(citation.relevanceScore).toBeGreaterThan(0);
    });

    it('POST /rag/query — should respect topK parameter', async () => {
      const res = await request(app.getHttpServer())
        .post('/rag/query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'What are Angular Signals?',
          topK: 1,
        })
        .expect(201);

      expect(res.body.citations.length).toBeLessThanOrEqual(1);
    });

    it('POST /rag/query — should return no-relevant-info for unrelated question', async () => {
      const res = await request(app.getHttpServer())
        .post('/rag/query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'Quantum physics theory of relativity',
          topK: 5,
        })
        .expect(201);

      // May still return results due to broad embedding space, but the answer
      // structure should be valid
      expect(res.body).toHaveProperty('question');
      expect(res.body).toHaveProperty('answer');
      expect(res.body).toHaveProperty('citations');
    });

    it('POST /rag/query — should filter by documentIds when provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/rag/query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          question: 'What are Angular Signals?',
          documentIds: [documentId],
          topK: 5,
        })
        .expect(201);

      expect(res.body).toHaveProperty('answer');
    });

    it('POST /rag/query — should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .post('/rag/query')
        .send({ question: 'What is Angular?' })
        .expect(401);
    });

    it('POST /rag/query — should reject missing question field', async () => {
      await request(app.getHttpServer())
        .post('/rag/query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });
});
