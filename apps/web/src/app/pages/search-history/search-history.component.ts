import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RagService, SearchHistoryEntry } from '../../services/rag.service';
import { NavbarComponent } from '../../components/navbar.component';

@Component({
  selector: 'app-search-history',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  template: `
    <app-navbar />
    <main class="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-indigo-50">
      <div class="max-w-5xl mx-auto px-4 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Search History</h1>
          <p class="text-gray-600 mt-1">Previous queries and their answers</p>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="flex justify-center items-center py-20">
            <svg class="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
        }

        <!-- Error State -->
        @if (error()) {
          <div class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            <p class="font-medium">{{ error() }}</p>
            <button (click)="loadHistory()" class="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors">
              Try Again
            </button>
          </div>
        }

        <!-- Empty State -->
        @if (isEmpty()) {
          <div class="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-xl font-semibold text-gray-500 mb-2">No search history yet</h3>
            <p class="text-gray-400 mb-6">Your previous queries will appear here.</p>
            <a routerLink="/query" class="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              Ask a Question
            </a>
          </div>
        }

        <!-- History List -->
        @if (!loading() && !error() && entries().length > 0) {
          <div class="space-y-6">
            @for (entry of entries(); track entry.id) {
              <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <!-- Question -->
                <div class="p-5 bg-gray-50 border-b border-gray-100">
                  <div class="flex items-start space-x-3">
                    <svg class="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                    <p class="text-gray-900 font-medium">{{ entry.question }}</p>
                  </div>
                </div>

                <!-- Answer -->
                <div class="p-5 border-b border-gray-50">
                  <p class="text-gray-700 leading-relaxed">{{ entry.answer }}</p>
                </div>

                <!-- Sources -->
                @if (entry.sources && entry.sources.length > 0) {
                  <div class="px-5 py-3 bg-indigo-50/50">
                    <details class="group">
                      <summary class="flex items-center space-x-2 text-sm text-indigo-700 font-medium cursor-pointer hover:text-indigo-800">
                        <svg class="w-4 h-4 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                        <span>{{ entry.sources.length }} source(s) used</span>
                      </summary>
                      <div class="mt-3 space-y-2">
                        @for (source of entry.sources; track source.chunkId) {
                          <div class="bg-white rounded-lg p-3 border border-indigo-100">
                            <div class="flex items-center justify-between mb-1">
                              <span class="text-xs text-indigo-600 font-medium">{{ source.documentTitle }}</span>
                              <span class="text-xs text-gray-500">Score: {{ (source.score * 100).toFixed(0) }}%</span>
                            </div>
                            <p class="text-sm text-gray-600">{{ source.content }}</p>
                          </div>
                        }
                      </div>
                    </details>
                  </div>
                }

                <!-- Timestamp -->
                <div class="px-5 py-2 bg-gray-50 text-right">
                  <span class="text-xs text-gray-400">{{ entry.createdAt }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </main>
  `,
})
export class SearchHistoryComponent {
  private ragService = inject(RagService);

  protected entries = signal<SearchHistoryEntry[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected isEmpty = computed(() => !this.loading() && this.entries().length === 0);

  constructor() {
    this.loadHistory();
  }

  loadHistory() {
    this.loading.set(true);
    this.error.set(null);
    this.ragService.getHistory().subscribe({
      next: (data) => {
        this.entries.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load search history.');
        this.loading.set(false);
      },
    });
  }
}
