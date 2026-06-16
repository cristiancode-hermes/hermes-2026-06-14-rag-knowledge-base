import { Test, TestingModule } from '@nestjs/testing';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';

describe('RagController', () => {
  let controller: RagController;
  let mockRagService: jest.Mocked<RagService>;

  beforeEach(async () => {
    mockRagService = {
      retrieveRelevantChunks: jest.fn(),
      generateAnswer: jest.fn(),
      embedText: jest.fn(),
      cosineSimilarity: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RagController],
      providers: [
        { provide: RagService, useValue: mockRagService },
      ],
    }).compile();

    controller = module.get<RagController>(RagController);
  });

  describe('query', () => {
    it('should return answer with citations', async () => {
      const dto = { question: 'What is Angular?', topK: 3 };
      const chunks = [
        {
          id: 'c1',
          content: 'Angular is a framework.',
          document: { title: 'Angular Guide' },
          embedding: '[]',
          documentId: 'd1',
          chunkIndex: 0,
          tokenCount: 5,
          createdAt: new Date(),
        },
      ];
      const answerResponse = {
        question: 'What is Angular?',
        answer: 'Based on retrieved information...',
        citations: [{ chunkId: 'c1', documentTitle: 'Angular Guide', excerpt: 'Angular is a framework.', relevanceScore: 0.9 }],
      };

      mockRagService.retrieveRelevantChunks.mockResolvedValue(chunks as any);
      mockRagService.generateAnswer.mockResolvedValue(answerResponse);

      const result = await controller.query(dto);

      expect(result).toEqual(answerResponse);
      expect(mockRagService.retrieveRelevantChunks).toHaveBeenCalledWith(
        dto.question,
        dto.topK,
        undefined,
      );
      expect(mockRagService.generateAnswer).toHaveBeenCalledWith(dto.question, chunks);
    });

    it('should use default topK of 5 when not provided', async () => {
      const dto = { question: 'What is Angular?' };
      mockRagService.retrieveRelevantChunks.mockResolvedValue([]);
      mockRagService.generateAnswer.mockResolvedValue({
        question: 'What is Angular?',
        answer: 'No relevant information found to answer this question.',
        citations: [],
      });

      await controller.query(dto);

      expect(mockRagService.retrieveRelevantChunks).toHaveBeenCalledWith(
        dto.question,
        5,
        undefined,
      );
    });

    it('should pass documentIds when provided', async () => {
      const dto = { question: 'What is NestJS?', documentIds: ['doc1', 'doc2'] };
      mockRagService.retrieveRelevantChunks.mockResolvedValue([]);
      mockRagService.generateAnswer.mockResolvedValue({
        question: 'What is NestJS?',
        answer: 'No relevant information found.',
        citations: [],
      });

      await controller.query(dto);

      expect(mockRagService.retrieveRelevantChunks).toHaveBeenCalledWith(
        dto.question,
        5,
        ['doc1', 'doc2'],
      );
    });
  });
});
