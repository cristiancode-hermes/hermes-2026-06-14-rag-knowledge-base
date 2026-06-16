import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RagService, RagQuery, RagResponse } from './rag.service';

describe('RagService', () => {
  let service: RagService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RagService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(RagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('query', () => {
    it('should send POST request to /rag/query with the question', () => {
      const queryData: RagQuery = {
        question: 'What is RAG?',
      };
      const mockResponse: RagResponse = {
        answer: 'RAG stands for Retrieval-Augmented Generation.',
        sources: [
          {
            chunkId: 1,
            documentId: 10,
            documentTitle: 'RAG Introduction',
            content: 'RAG is a technique...',
            score: 0.95,
          },
        ],
        queryTimeMs: 120,
      };

      service.query(queryData).subscribe((res) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/rag/query');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(queryData);
      req.flush(mockResponse);
    });

    it('should send POST request with documentIds when provided', () => {
      const queryData: RagQuery = {
        question: 'Summarize document 5',
        documentIds: [5],
      };

      service.query(queryData).subscribe();

      const req = httpMock.expectOne('http://localhost:3000/rag/query');
      expect(req.request.body).toEqual(queryData);
      req.flush({ answer: '', sources: [], queryTimeMs: 0 });
    });
  });

  describe('getHistory', () => {
    it('should send GET request to /rag/history', () => {
      const mockHistory = [
        {
          id: 1,
          question: 'What is RAG?',
          answer: 'RAG stands for...',
          sources: [],
          createdAt: '2025-01-01T00:00:00Z',
        },
      ];

      service.getHistory().subscribe((history) => {
        expect(history).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('http://localhost:3000/rag/history');
      expect(req.request.method).toBe('GET');
      req.flush(mockHistory);
    });

    it('should return an empty array when there is no history', () => {
      service.getHistory().subscribe((history) => {
        expect(history).toEqual([]);
      });

      const req = httpMock.expectOne('http://localhost:3000/rag/history');
      req.flush([]);
    });
  });
});
