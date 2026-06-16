import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Document } from '../documents/document.entity';
import { Chunk } from '../chunks/chunk.entity';
import { RagService } from '../rag/rag.service';

describe('SeedService', () => {
  let service: SeedService;
  let mockDocumentRepo: jest.Mocked<Repository<Document>>;
  let mockChunkRepo: jest.Mocked<Repository<Chunk>>;
  let mockRagService: jest.Mocked<RagService>;

  beforeEach(async () => {
    mockDocumentRepo = {
      count: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;
    mockChunkRepo = {
      delete: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;
    mockRagService = {
      embedText: jest.fn(),
    } as any;
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    service = new SeedService(
      mockDocumentRepo as any,
      mockChunkRepo as any,
      mockRagService as any,
    );
  });

  describe('seed', () => {
    it('should clear existing data and seed documents with chunks and embeddings', async () => {
      // No existing data
      mockDocumentRepo.count.mockResolvedValue(0);

      // Mock document save
      const savedDocs = [
        { id: 'doc1', title: 'Angular Signals and Change Detection', content: 'Some content about Angular Signals.' } as Document,
        { id: 'doc2', title: 'NestJS Architecture Patterns', content: 'Some content about NestJS.' } as Document,
      ];
      mockDocumentRepo.save.mockResolvedValue(savedDocs);

      // Mock chunk creation
      mockChunkRepo.create.mockImplementation((data: Partial<Chunk>) => data as Chunk);
      mockChunkRepo.save.mockResolvedValue([{
        id: 'chunk1',
        documentId: 'doc1',
        content: 'Some content about Angular Signals.',
        chunkIndex: 0,
        tokenCount: 5,
      } as Chunk]);

      // Mock embedding
      mockRagService.embedText.mockReturnValue(Array(100).fill(0.1));

      const result = await service.seed();

      expect(result.message).toBe('Database seeded successfully');
      expect(result.documentCount).toBe(2);
      expect(mockDocumentRepo.count).toHaveBeenCalled();
      expect(mockDocumentRepo.save).toHaveBeenCalled();
      expect(mockChunkRepo.delete).not.toHaveBeenCalled(); // no existing data to clear
      expect(mockRagService.embedText).toHaveBeenCalled();
    });

    it('should clear existing data and re-seed when data already exists', async () => {
      mockDocumentRepo.count.mockResolvedValue(5);
      mockChunkRepo.delete.mockResolvedValue({ affected: 0, raw: {} } as any);
      mockDocumentRepo.delete.mockResolvedValue({ affected: 0, raw: {} } as any);

      const savedDocs = [
        { id: 'doc1', title: 'Angular Signals and Change Detection', content: 'New content.' } as Document,
      ];
      mockDocumentRepo.save.mockResolvedValue(savedDocs);

      mockChunkRepo.create.mockImplementation((data: Partial<Chunk>) => data as Chunk);
      mockChunkRepo.save.mockResolvedValue([{
        id: 'chunk1',
        documentId: 'doc1',
        content: 'New content.',
        chunkIndex: 0,
        tokenCount: 2,
      } as Chunk]);

      mockRagService.embedText.mockReturnValue(Array(100).fill(0.01));

      const result = await service.seed();

      expect(result.message).toBe('Database seeded successfully');
      expect(mockChunkRepo.delete).toHaveBeenCalledWith({});
      expect(mockDocumentRepo.delete).toHaveBeenCalledWith({});
    });

    it('should seed all 5 predefined documents', async () => {
      mockDocumentRepo.count.mockResolvedValue(0);
      const savedDocs = Array.from({ length: 5 }, (_, i) => ({
        id: `doc${i}`,
        title: `Doc ${i}`,
        content: 'Content here.',
      } as Document));
      mockDocumentRepo.save.mockResolvedValue(savedDocs);
      mockChunkRepo.create.mockImplementation((data: Partial<Chunk>) => data as Chunk);
      mockChunkRepo.save.mockResolvedValue([{
        id: 'chunk1',
        documentId: 'doc0',
        content: 'Content here.',
        chunkIndex: 0,
        tokenCount: 2,
      } as Chunk]);
      mockRagService.embedText.mockReturnValue(Array(100).fill(0.05));

      const result = await service.seed();

      expect(result.documentCount).toBe(5);
    });
  });
});
