import { Repository } from 'typeorm';
import { RagService } from './rag.service';
import { Chunk } from '../chunks/chunk.entity';
import { Document } from '../documents/document.entity';

describe('RagService', () => {
  let service: RagService;
  let mockChunkRepo: jest.Mocked<Repository<Chunk>>;
  let mockDocRepo: jest.Mocked<Repository<Document>>;

  beforeEach(async () => {
    mockChunkRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;
    mockDocRepo = {
      findOne: jest.fn(),
    } as any;
    service = new RagService(mockChunkRepo as any, mockDocRepo as any);
  });

  describe('embedText', () => {
    it('should return a 100-dimensional vector', () => {
      const result = service.embedText('hello world');
      expect(result).toBeDefined();
      expect(result.length).toBe(100);
    });

    it('should return a unit-normalized vector', () => {
      const result = service.embedText('test text for embedding');
      const magnitude = Math.sqrt(result.reduce((sum, v) => sum + v * v, 0));
      expect(magnitude).toBeCloseTo(1, 1);
    });

    it('should produce more similar vectors for similar texts than different ones', () => {
      const v1 = service.embedText('machine learning algorithms');
      const v2 = service.embedText('machine learning models');
      const v3 = service.embedText('cooking pasta recipes');

      const sim12 = service.cosineSimilarity(v1, v2);
      const sim13 = service.cosineSimilarity(v1, v3);

      expect(sim12).toBeGreaterThan(sim13);
    });

    it('should handle empty text', () => {
      const result = service.embedText('');
      expect(result.length).toBe(100);
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const v = [1, 2, 3, 4, 5];
      expect(service.cosineSimilarity(v, v)).toBeCloseTo(1, 2);
    });

    it('should return 0 for orthogonal vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [0, 1, 0];
      expect(service.cosineSimilarity(v1, v2)).toBeCloseTo(0, 2);
    });

    it('should handle zero vectors', () => {
      const v = [0, 0, 0];
      expect(service.cosineSimilarity(v, v)).toBe(0);
    });
  });

  describe('retrieveRelevantChunks', () => {
    it('should return empty array when no chunks have embeddings', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockChunkRepo.createQueryBuilder = jest.fn().mockReturnValue(qb as any);
      const result = await service.retrieveRelevantChunks('test query', 5);
      expect(result).toEqual([]);
    });
  });

  describe('generateAnswer', () => {
    it('should generate answer with citations', async () => {
      const chunk = {
        id: '1', content: 'Machine learning is a subset of artificial intelligence.',
        chunkIndex: 0, tokenCount: 10,
        embedding: JSON.stringify(service.embedText('machine learning')),
        documentId: 'd1',
        document: { id: 'd1', title: 'ML Basics' },
        createdAt: new Date(),
      } as Chunk;

      const result = await service.generateAnswer('What is ML?', [chunk]);
      expect(result.question).toBe('What is ML?');
      expect(result.answer).toBeTruthy();
      expect(result.answer.length).toBeGreaterThan(10);
      expect(result.citations.length).toBe(1);
      expect(result.citations[0].documentTitle).toBe('ML Basics');
    });

    it('should handle empty chunks gracefully', async () => {
      const result = await service.generateAnswer('What is X?', []);
      expect(result.question).toBe('What is X?');
      expect(result.answer).toContain('No relevant information');
    });
  });
});
