import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RagService, RagResponse, RagSource } from '../../services/rag.service';
import { DocumentService, Document } from '../../services/document.service';
import { NavbarComponent } from '../../components/navbar.component';

@Component({
  selector: 'app-query',
  standalone: true,
  imports: [ReactiveFormsModule, NavbarComponent],
  template: `
    <app-navbar />
    <main class="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-indigo-50">
      <div class="max-w-5xl mx-auto px-4 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Ask a Question</h1>
          <p class="text-gray-600 mt-1">Query your knowledge base using RAG</p>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-6 border border-indigo-50 mb-8">
          <form [formGroup]="queryForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Question Input -->
            <div>
              <label for="question" class="block text-sm font-medium text-gray-700 mb-1">Your Question</label>
              <div class="flex space-x-3">
                <input
                  id="question"
                  type="text"
                  formControlName="question"
                  class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="What would you like to know about your documents?"
                />
                <button
                  type="submit"
                  [disabled]="queryForm.invalid || loading()"
                  class="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  @if (loading()) {
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Asking...</span>
                  } @else {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    <span>Ask</span>
                  }
                </button>
              </div>
              @if (queryForm.get('question')?.touched && queryForm.get('question')?.invalid) {
                <p class="text-red-500 text-sm mt-1">Please enter a question</p>
              }
            </div>

            <!-- Document Filter -->
            <div>
              <label for="documentFilter" class="block text-sm font-medium text-gray-700 mb-1">Filter by Document (optional)</label>
              <select
                id="documentFilter"
                formControlName="documentFilter"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-white"
              >
                <option [value]="null">All Documents</option>
                @for (doc of availableDocuments(); track doc.id) {
                  <option [value]="doc.id">{{ doc.title }}</option>
                }
              </select>
            </div>
          </form>
        </div>

        <!-- Loading State -->
        @if (loadingState() === 'retrieving') {
          <div class="bg-white rounded-2xl shadow-lg p-8 border border-indigo-50 mb-8">
            <div class="flex items-center space-x-4">
              <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <div>
                <p class="font-medium text-gray-900">Searching relevant documents...</p>
                <p class="text-sm text-gray-500">Retrieving chunks similar to your question</p>
              </div>
            </div>
          </div>
        }

        @if (loadingState() === 'generating') {
          <div class="bg-white rounded-2xl shadow-lg p-8 border border-indigo-50 mb-8">
            <div class="flex items-center space-x-4">
              <svg class="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <div>
                <p class="font-medium text-gray-900">Generating answer...</p>
                <p class="text-sm text-gray-500">Using retrieved chunks to formulate a response</p>
              </div>
            </div>
          </div>
        }

        <!-- Error State -->
        @if (error()) {
          <div class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8">
            <p class="font-medium">{{ error() }}</p>
          </div>
        }

        <!-- Answer -->
        @if (answer()) {
          <div class="bg-white rounded-2xl shadow-lg overflow-hidden border border-indigo-50">
            <!-- Answer Header -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">Answer</h2>
                @if (queryTimeMs()) {
                  <span class="text-indigo-200 text-sm">{{ queryTimeMs() }}ms</span>
                }
              </div>
            </div>

            <!-- Answer Content -->
            <div class="p-6 border-b border-gray-100">
              <p class="text-gray-800 leading-relaxed whitespace-pre-wrap">{{ answer() }}</p>
            </div>

            <!-- Citations -->
            @if (sources().length > 0) {
              <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                  <span>Sources ({{ sources().length }})</span>
                </h3>
                <div class="space-y-3">
                  @for (source of sources(); track source.chunkId) {
                    <div class="border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2">
                          <span class="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Relevance: {{ (source.score * 100).toFixed(1) }}%</span>
                          <span class="text-xs text-gray-500">Document: {{ source.documentTitle }}</span>
                        </div>
                        <div class="flex items-center space-x-1">
                          <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full bg-indigo-500 rounded-full" [style.width.%]="source.score * 100"></div>
                          </div>
                        </div>
                      </div>
                      <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ source.content }}</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Empty State -->
        @if (!answer() && loadingState() === 'idle' && !error()) {
          <div class="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            <h3 class="text-xl font-semibold text-gray-500 mb-2">Ask a question to get started</h3>
            <p class="text-gray-400">Type your question above and the AI will search through your documents to find the answer.</p>
          </div>
        }
      </div>
    </main>
  `,
})
export class QueryComponent {
  private fb = inject(FormBuilder);
  private ragService = inject(RagService);
  private documentService = inject(DocumentService);

  protected queryForm: FormGroup;
  protected loadingState = signal<'idle' | 'retrieving' | 'generating'>('idle');
  protected answer = signal<string | null>(null);
  protected sources = signal<RagSource[]>([]);
  protected queryTimeMs = signal<number | null>(null);
  protected error = signal<string | null>(null);
  protected availableDocuments = signal<Document[]>([]);

  protected loading = computed(() => this.loadingState() !== 'idle');

  constructor() {
    this.queryForm = this.fb.group({
      question: ['', Validators.required],
      documentFilter: [null],
    });

    this.loadDocuments();
  }

  private loadDocuments() {
    this.documentService.getAll().subscribe({
      next: (docs) => this.availableDocuments.set(docs),
      error: () => {},
    });
  }

  onSubmit() {
    if (this.queryForm.invalid) return;

    this.loadingState.set('retrieving');
    this.answer.set(null);
    this.sources.set([]);
    this.queryTimeMs.set(null);
    this.error.set(null);

    const question = this.queryForm.get('question')?.value ?? '';
    const documentFilter = this.queryForm.get('documentFilter')?.value;

    const payload: { question: string; documentIds?: number[] } = { question };

    if (documentFilter) {
      payload.documentIds = [Number(documentFilter)];
    }

    this.ragService.query(payload).subscribe({
      next: (response: RagResponse) => {
        this.loadingState.set('generating');
        // Simulate streaming-like effect
        setTimeout(() => {
          this.answer.set(response.answer);
          this.sources.set(response.sources);
          this.queryTimeMs.set(response.queryTimeMs);
          this.loadingState.set('idle');
        }, 500);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to get answer. Is the server running?');
        this.loadingState.set('idle');
      },
    });
  }
}
