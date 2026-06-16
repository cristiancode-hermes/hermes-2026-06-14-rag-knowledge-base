import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ChunksService } from './chunks.service';
import { Chunk } from './chunk.entity';
import { Document } from '../documents/document.entity';

describe('ChunksService', () => {
  let service: ChunksService;
  let mockChunkRepo: jest.Mocked<Repository<Chunk>>;
  let mockDocumentRepo: jest.Mocked<Repository<Document>>;

  beforeEach(async () => {
    mockChunkRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;
    mockDocumentRepo = {
      findOne: jest.fn(),
    } as any;
    service = new ChunksService(mockChunkRepo as any, mockDocumentRepo as any);
  });

  describe('findByDocumentId', () => {
    it('should return chunks ordered by chunkIndex with document relation', async () => {
      const chunks = [
        { id: 'c1', documentId: 'd1', chunkIndex: 0, content: 'part1' } as Chunk,
        { id: 'c2', documentId: 'd1', chunkIndex: 1, content: 'part2' } as Chunk,
      ];
      mockChunkRepo.find.mockResolvedValue(chunks);

      const result = await service.findByDocumentId('d1');

      expect(result).toEqual(chunks);
      expect(mockChunkRepo.find).toHaveBeenCalledWith({
        where: { documentId: 'd1' },
        order: { chunkIndex: 'ASC' },
        relations: { document: true },
      });
    });

    it('should return empty array when no chunks found', async () => {
      mockChunkRepo.find.mockResolvedValue([]);

      const result = await service.findByDocumentId('d1');

      expect(result).toEqual([]);
    });
  });

  describe('rechunk', () => {
    it('should delete existing chunks and create new ones', async () => {
      const doc = { id: 'd1', content: 'word1 word2 word3' } as Document;
      mockDocumentRepo.findOne.mockResolvedValue(doc);
      mockChunkRepo.delete.mockResolvedValue({ affected: 0, raw: {} } as any);

      const createdChunks = [
        { id: 'c1', documentId: 'd1', content: 'word1 word2 word3', chunkIndex: 0, tokenCount: 3 } as Chunk,
      ];
      mockChunkRepo.create.mockReturnValue(createdChunks[0]);
      mockChunkRepo.save.mockResolvedValue(createdChunks);

      const result = await service.rechunk('d1');

      expect(result).toEqual(createdChunks);
      expect(mockDocumentRepo.findOne).toHaveBeenCalledWith({ where: { id: 'd1' } });
      expect(mockChunkRepo.delete).toHaveBeenCalledWith({ documentId: 'd1' });
    });

    it('should throw NotFoundException when document does not exist', async () => {
      mockDocumentRepo.findOne.mockResolvedValue(null);

      await expect(service.rechunk('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('chunkDocument', () => {
    it('should delegate to createChunks via rechunk', async () => {
      const doc = { id: 'd1', content: 'some content here' } as Document;
      mockDocumentRepo.findOne.mockResolvedValue(doc);
      mockChunkRepo.delete.mockResolvedValue({ affected: 0, raw: {} } as any);
      const createdChunk = { id: 'c1', documentId: 'd1', content: 'some content here', chunkIndex: 0, tokenCount: 3 } as Chunk;
      mockChunkRepo.create.mockReturnValue(createdChunk);
      mockChunkRepo.save.mockResolvedValue([createdChunk]);

      const result = await service.chunkDocument('d1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('saveEmbedding', () => {
    it('should update chunk with embedding', async () => {
      mockChunkRepo.update.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.saveEmbedding('c1', [0.1, 0.2, 0.3]);

      expect(mockChunkRepo.update).toHaveBeenCalledWith('c1', {
        embedding: JSON.stringify([0.1, 0.2, 0.3]),
      });
    });
  });

  describe('findAllWithEmbeddings', () => {
    it('should find chunks with empty embedding string (placeholder)', async () => {
      mockChunkRepo.find.mockResolvedValue([]);

      const result = await service.findAllWithEmbeddings();

      expect(result).toEqual([]);
      expect(mockChunkRepo.find).toHaveBeenCalledWith({
        where: { embedding: '' },
      });
    });
  });

  describe('findChunksWithEmbeddings', () => {
    it('should use query builder to find chunks with non-null embeddings', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockChunkRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findChunksWithEmbeddings();

      expect(result).toEqual([]);
      expect(mockChunkRepo.createQueryBuilder).toHaveBeenCalledWith('chunk');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('chunk.embedding IS NOT NULL');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("chunk.embedding != ''");
    });

    it('should filter by documentIds when provided', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockChunkRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findChunksWithEmbeddings(['d1', 'd2']);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'chunk.documentId IN (:...documentIds)',
        { documentIds: ['d1', 'd2'] },
      );
    });
  });
});
