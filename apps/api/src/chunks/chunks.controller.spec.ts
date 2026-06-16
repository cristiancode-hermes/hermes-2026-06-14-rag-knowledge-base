import { Test, TestingModule } from '@nestjs/testing';
import { ChunksController } from './chunks.controller';
import { ChunksService } from './chunks.service';

describe('ChunksController', () => {
  let controller: ChunksController;
  let mockChunksService: jest.Mocked<ChunksService>;

  beforeEach(async () => {
    mockChunksService = {
      findByDocumentId: jest.fn(),
      rechunk: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChunksController],
      providers: [
        { provide: ChunksService, useValue: mockChunksService },
      ],
    }).compile();

    controller = module.get<ChunksController>(ChunksController);
  });

  describe('findByDocumentId', () => {
    it('should return chunks for a document', async () => {
      const chunks = [
        { id: 'c1', documentId: 'd1', chunkIndex: 0, content: 'part1' },
        { id: 'c2', documentId: 'd1', chunkIndex: 1, content: 'part2' },
      ];
      mockChunksService.findByDocumentId.mockResolvedValue(chunks as any);

      const result = await controller.findByDocumentId('d1');

      expect(result).toEqual(chunks);
      expect(mockChunksService.findByDocumentId).toHaveBeenCalledWith('d1');
    });
  });

  describe('rechunk', () => {
    it('should rechunk a document', async () => {
      const chunks = [
        { id: 'c1', documentId: 'd1', chunkIndex: 0, content: 'rechunked content' },
      ];
      mockChunksService.rechunk.mockResolvedValue(chunks as any);

      const result = await controller.rechunk('d1');

      expect(result).toEqual(chunks);
      expect(mockChunksService.rechunk).toHaveBeenCalledWith('d1');
    });
  });
});
