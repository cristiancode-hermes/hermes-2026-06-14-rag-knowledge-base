import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Document } from './document.entity';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let mockDocumentRepo: jest.Mocked<Repository<Document>>;

  beforeEach(async () => {
    mockDocumentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as any;
    service = new DocumentsService(mockDocumentRepo as any);
  });

  describe('create', () => {
    it('should create and return a document', async () => {
      const dto = { title: 'Test Doc', content: 'Test content', source: 'paste' };
      const createdDoc = {
        id: 'uuid-123',
        title: dto.title,
        content: dto.content,
        source: dto.source,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Document;

      mockDocumentRepo.create.mockReturnValue(createdDoc);
      mockDocumentRepo.save.mockResolvedValue(createdDoc);

      const result = await service.create(dto);

      expect(result).toEqual(createdDoc);
      expect(mockDocumentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: dto.title,
          content: dto.content,
          source: dto.source,
        }),
      );
      expect(mockDocumentRepo.save).toHaveBeenCalledWith(createdDoc);
    });
  });

  describe('findAll', () => {
    it('should return all documents ordered by createdAt DESC', async () => {
      const docs = [
        { id: '1', title: 'Doc 1', createdAt: new Date('2024-01-02') } as Document,
        { id: '2', title: 'Doc 2', createdAt: new Date('2024-01-01') } as Document,
      ];
      mockDocumentRepo.find.mockResolvedValue(docs);

      const result = await service.findAll();

      expect(result).toEqual(docs);
      expect(mockDocumentRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no documents exist', async () => {
      mockDocumentRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a document when found', async () => {
      const doc = { id: 'uuid-123', title: 'Test Doc' } as Document;
      mockDocumentRepo.findOne.mockResolvedValue(doc);

      const result = await service.findOne('uuid-123');

      expect(result).toEqual(doc);
      expect(mockDocumentRepo.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-123' } });
    });

    it('should throw NotFoundException when document not found', async () => {
      mockDocumentRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a document when it exists', async () => {
      mockDocumentRepo.delete.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.remove('uuid-123');

      expect(mockDocumentRepo.delete).toHaveBeenCalledWith('uuid-123');
    });

    it('should throw NotFoundException when document does not exist', async () => {
      mockDocumentRepo.delete.mockResolvedValue({ affected: 0, raw: {} } as any);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
