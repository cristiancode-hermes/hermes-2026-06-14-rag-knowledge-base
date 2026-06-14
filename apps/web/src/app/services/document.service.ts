import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Document {
  id: number;
  title: string;
  content: string;
  source: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chunk {
  id: number;
  documentId: number;
  content: string;
  index: number;
  tokenCount: number;
}

export interface DocumentWithChunks extends Document {
  chunks: Chunk[];
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  getAll() {
    return this.http.get<Document[]>(`${this.apiUrl}/documents`);
  }

  getById(id: number) {
    return this.http.get<DocumentWithChunks>(`${this.apiUrl}/documents/${id}`);
  }

  create(data: { title: string; content: string; source: string }) {
    return this.http.post<Document>(`${this.apiUrl}/documents`, data);
  }

  update(id: number, data: { title?: string; content?: string; source?: string }) {
    return this.http.patch<Document>(`${this.apiUrl}/documents/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/documents/${id}`);
  }

  rechunk(id: number) {
    return this.http.post<DocumentWithChunks>(`${this.apiUrl}/documents/${id}/rechunk`, {});
  }
}
