import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface RagQuery {
  question: string;
  documentIds?: number[];
}

export interface RagSource {
  chunkId: number;
  documentId: number;
  documentTitle: string;
  content: string;
  score: number;
}

export interface RagResponse {
  answer: string;
  sources: RagSource[];
  queryTimeMs: number;
}

export interface SearchHistoryEntry {
  id: number;
  question: string;
  answer: string;
  sources: RagSource[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class RagService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  query(data: RagQuery) {
    return this.http.post<RagResponse>(`${this.apiUrl}/rag/query`, data);
  }

  getHistory() {
    return this.http.get<SearchHistoryEntry[]>(`${this.apiUrl}/rag/history`);
  }
}
