import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DocumentService, DocumentWithChunks } from '../../services/document.service';
import { NavbarComponent } from '../../components/navbar.component';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  template: `
    <app-navbar />
    <main class="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-indigo-50">
      <div class="max-w-4xl mx-auto px-4 py-8">
        <!-- Loading -->
        @if (loading()) {
          <div class="flex justify-center items-center py-20">
            <svg class="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
        }

        <!-- Error -->
        @if (error()) {
          <div class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            <p class="font-medium">{{ error() }}</p>
            <a routerLink="/documents" class="mt-3 inline-block px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors">
              Back to Documents
            </a>
          </div>
        }

        <!-- Document Detail -->
        @if (!loading() && !error() && document()) {
          @let doc = document()!;
          <div class="flex items-center space-x-3 mb-6">
            <a routerLink="/documents" class="text-gray-500 hover:text-gray-700 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </a>
            <h1 class="text-3xl font-bold text-gray-900 truncate">{{ doc.title }}</h1>
          </div>

          <div class="flex items-center space-x-4 mb-6 text-sm text-gray-500">
            <span class="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full">
              <span class="font-medium">Source:</span>
              <span>{{ doc.source }}</span>
            </span>
            <span class="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full">
              <span class="font-medium">Chunks:</span>
              <span>{{ doc.chunks?.length || 0 }}</span>
            </span>
            <button (click)="rechunk()" [disabled]="rechunking()" class="ml-auto px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 disabled:opacity-50 transition-colors">
              @if (rechunking()) {
                Rechunking...
              } @else {
                Re-chunk
              }
            </button>
          </div>

          <!-- Document Content -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 class="text-lg font-semibold text-gray-700 mb-3">Content</h2>
            <div class="prose max-w-none text-gray-600 whitespace-pre-wrap font-mono text-sm leading-relaxed">{{ doc.content }}</div>
          </div>

          <!-- Chunks -->
          @if (doc.chunks && doc.chunks.length > 0) {
            <div>
              <h2 class="text-xl font-semibold text-gray-800 mb-4">Chunks ({{ doc.chunks.length }})</h2>
              <div class="space-y-3">
                @for (chunk of doc.chunks; track chunk.id) {
                  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-indigo-200 transition-colors">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Chunk {{ chunk.index + 1 }}</span>
                      <span class="text-xs text-gray-400">{{ chunk.tokenCount }} tokens</span>
                    </div>
                    <p class="text-gray-600 text-sm whitespace-pre-wrap">{{ chunk.content }}</p>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
              <p class="text-gray-500">No chunks available yet.</p>
            </div>
          }
        }
      </div>
    </main>
  `,
})
export class DocumentDetailComponent {
  private route = inject(ActivatedRoute);
  private documentService = inject(DocumentService);

  protected document = signal<DocumentWithChunks | null>(null);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected rechunking = signal(false);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      this.error.set('Invalid document ID');
      this.loading.set(false);
      return;
    }
    this.loadDocument(id);
  }

  private loadDocument(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.documentService.getById(id).subscribe({
      next: (doc) => {
        this.document.set(doc);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load document.');
        this.loading.set(false);
      },
    });
  }

  rechunk() {
    const doc = this.document();
    if (!doc) return;

    this.rechunking.set(true);
    this.documentService.rechunk(doc.id).subscribe({
      next: (updated) => {
        this.document.set(updated);
        this.rechunking.set(false);
      },
      error: () => {
        this.rechunking.set(false);
      },
    });
  }
}
