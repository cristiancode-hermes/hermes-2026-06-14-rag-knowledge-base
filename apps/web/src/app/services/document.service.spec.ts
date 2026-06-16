import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DocumentService, Document } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DocumentService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should send GET request to /documents', () => {
      const mockDocs: Document[] = [
        { id: 1, title: 'Doc 1', content: 'Content 1', source: 'paste', userId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 2, title: 'Doc 2', content: 'Content 2', source: 'upload', userId: 1, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
      ];

      service.getAll().subscribe((docs) => {
        expect(docs).toEqual(mockDocs);
      });

      const req = httpMock.expectOne('http://localhost:3000/documents');
      expect(req.request.method).toBe('GET');
      req.flush(mockDocs);
    });
  });

  describe('getById', () => {
    it('should send GET request to /documents/:id', () => {
      const mockDoc = {
        id: 1,
        title: 'Doc 1',
        content: 'Content',
        source: 'paste',
        userId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        chunks: [{ id: 1, documentId: 1, content: 'Chunk 1', index: 0, tokenCount: 10 }],
      };

      service.getById(1).subscribe((doc) => {
        expect(doc).toEqual(mockDoc as any);
      });

      const req = httpMock.expectOne('http://localhost:3000/documents/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockDoc);
    });
  });

  describe('create', () => {
    it('should send POST request to /documents', () => {
      const data = { title: 'New Doc', content: 'New content', source: 'paste' };
      const mockResponse: Document = { id: 3, ...data, userId: 1, createdAt: '2024-01-03', updatedAt: '2024-01-03' };

      service.create(data).subscribe((doc) => {
        expect(doc).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/documents');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('should send PATCH request to /documents/:id', () => {
      const data = { title: 'Updated Title' };
      const mockResponse: Document = { id: 1, title: 'Updated Title', content: 'Content', source: 'paste', userId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-02' };

      service.update(1, data).subscribe((doc) => {
        expect(doc).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/documents/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(data);
      req.flush(mockResponse);
    });
  });

  describe('delete', () => {
    it('should send DELETE request to /documents/:id', () => {
      service.delete(1).subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne('http://localhost:3000/documents/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('rechunk', () => {
    it('should send POST request to /documents/:id/rechunk', () => {
      const mockResponse = {
        id: 1,
        title: 'Doc',
        content: 'Content',
        source: 'paste',
        userId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        chunks: [{ id: 1, documentId: 1, content: 'Rechunked', index: 0, tokenCount: 5 }],
      };

      service.rechunk(1).subscribe((doc) => {
        expect(doc).toEqual(mockResponse as any);
      });

      const req = httpMock.expectOne('http://localhost:3000/documents/1/rechunk');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });
});
