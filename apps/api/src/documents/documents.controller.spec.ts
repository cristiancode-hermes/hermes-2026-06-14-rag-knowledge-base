import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let mockDocumentsService: jest.Mocked<DocumentsService>;

  beforeEach(async () => {
    mockDocumentsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: mockDocumentsService },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  describe('create', () => {
    it('should call documentsService.create', async () => {
      const dto = { title: 'Test', content: 'Content', source: 'paste' };
      const expected = { id: '1', ...dto, createdAt: new Date(), updatedAt: new Date() };
      mockDocumentsService.create.mockResolvedValue(expected as any);

      const result = await controller.create(dto);

      expect(result).toEqual(expected);
      expect(mockDocumentsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all documents', async () => {
      const docs = [{ id: '1', title: 'Doc 1' }, { id: '2', title: 'Doc 2' }];
      mockDocumentsService.findAll.mockResolvedValue(docs as any);

      const result = await controller.findAll();

      expect(result).toEqual(docs);
      expect(mockDocumentsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a document by id', async () => {
      const doc = { id: 'uuid-123', title: 'Test' };
      mockDocumentsService.findOne.mockResolvedValue(doc as any);

      const result = await controller.findOne('uuid-123');

      expect(result).toEqual(doc);
      expect(mockDocumentsService.findOne).toHaveBeenCalledWith('uuid-123');
    });
  });

  describe('remove', () => {
    it('should delete a document by id', async () => {
      mockDocumentsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('uuid-123');

      expect(result).toBeUndefined();
      expect(mockDocumentsService.remove).toHaveBeenCalledWith('uuid-123');
    });
  });
});
