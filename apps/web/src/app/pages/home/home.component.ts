import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeedService } from '../../services/seed.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../components/navbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  template: `
    <app-navbar />
    <main class="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div class="max-w-7xl mx-auto px-4 py-16">
        <!-- Hero Section -->
        <div class="text-center mb-16">
          <h1 class="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            RAG <span class="text-indigo-600">Knowledge Base</span>
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Upload documents, ask questions, and get AI-powered answers with citations from your private knowledge base.
            Built with Retrieval-Augmented Generation (RAG) technology.
          </p>
        </div>

        <!-- Feature Cards -->
        <div class="grid md:grid-cols-3 gap-8 mb-16">
          <div class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-indigo-50">
            <div class="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-5">
              <svg class="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Document Management</h3>
            <p class="text-gray-600 leading-relaxed">Upload, organize, and manage your documents. Automatic chunking and indexing for efficient retrieval.</p>
          </div>

          <div class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-indigo-50">
            <div class="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-5">
              <svg class="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">AI Q&A</h3>
            <p class="text-gray-600 leading-relaxed">Ask natural language questions and get precise answers extracted from your documents with source citations.</p>
          </div>

          <div class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-indigo-50">
            <div class="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
              <svg class="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Transparent Citations</h3>
            <p class="text-gray-600 leading-relaxed">Every answer includes references to source documents with relevance scores for complete transparency.</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="flex justify-center space-x-4 mb-16">
          <a routerLink="/documents" class="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Browse Documents
          </a>
          <a routerLink="/query" class="px-8 py-3.5 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors shadow-lg border border-indigo-200">
            Ask a Question
          </a>
        </div>

        <!-- Seed Demo Data -->
        @if (!authService.isAuthenticated()) {
          <div class="text-center p-8 bg-white rounded-2xl shadow-md border border-dashed border-indigo-200 max-w-lg mx-auto">
            <p class="text-gray-600 mb-4">Want to try it out first? Seed the database with demo documents.</p>
            <button
              (click)="seedData()"
              [disabled]="seeding()"
              class="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              @if (seeding()) {
                <span class="flex items-center space-x-2">
                  <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Seeding...</span>
                </span>
              } @else {
                Seed Demo Data
              }
            </button>
            @if (seedMessage()) {
              <p class="mt-3 text-sm text-emerald-600 font-medium">{{ seedMessage() }}</p>
            }
            @if (seedError()) {
              <p class="mt-3 text-sm text-red-600 font-medium">{{ seedError() }}</p>
            }
          </div>
        }
      </div>
    </main>
  `,
})
export class HomeComponent {
  private seedService = inject(SeedService);
  protected authService = inject(AuthService);

  protected seeding = signal(false);
  protected seedMessage = signal<string | null>(null);
  protected seedError = signal<string | null>(null);

  seedData() {
    this.seeding.set(true);
    this.seedMessage.set(null);
    this.seedError.set(null);
    this.seedService.trigger().subscribe({
      next: (res) => {
        this.seedMessage.set(res.message);
        this.seeding.set(false);
      },
      error: () => {
        this.seedError.set('Failed to seed data. Is the server running?');
        this.seeding.set(false);
      },
    });
  }
}
