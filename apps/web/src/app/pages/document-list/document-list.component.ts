import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DocumentService, Document } from '../../services/document.service';
import { NavbarComponent } from '../../components/navbar.component';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [RouterLink, NavbarComponent, DatePipe],
  template: `
    <app-navbar />
    <main class="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-indigo-50">
      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Documents</h1>
            <p class="text-gray-600 mt-1">Manage your knowledge base documents</p>
          </div>
          <a routerLink="/documents/new" class="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow shadow-indigo-200">
            + New Document
          </a>
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
            <button (click)="loadDocuments()" class="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors">
              Try Again
            </button>
          </div>
        }

        <!-- Empty State -->
        @if (isEmpty()) {
          <div class="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h3 class="text-xl font-semibold text-gray-500 mb-2">No documents yet</h3>
            <p class="text-gray-400 mb-6">Create your first document to start building your knowledge base.</p>
            <a routerLink="/documents/new" class="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              Create Document
            </a>
          </div>
        }

        <!-- Document List -->
        @if (!loading() && !error() && documents().length > 0) {
          <div class="grid gap-4">
            @for (doc of documents(); track doc.id) {
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <a [routerLink]="['/documents', doc.id]" class="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate block">
                      {{ doc.title }}
                    </a>
                    <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span class="flex items-center space-x-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <span>{{ doc.source }}</span>
                      </span>
                      <span>{{ doc.createdAt | date }}</span>
                    </div>
                  </div>
                  <button (click)="confirmDelete(doc)" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete document">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </main>

    <!-- Delete Confirmation Modal -->
    @if (deleteTarget()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="cancelDelete()">
        <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete Document</h3>
          <p class="text-gray-600 mb-6">Are you sure you want to delete "{{ deleteTarget()?.title }}"? This action cannot be undone.</p>
          <div class="flex justify-end space-x-3">
            <button (click)="cancelDelete()" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button (click)="doDelete()" [disabled]="deleting()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              @if (deleting()) {
                Deleting...
              } @else {
                Delete
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DocumentListComponent {
  private documentService = inject(DocumentService);

  protected documents = signal<Document[]>([]);
  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected isEmpty = computed(() => !this.loading() && this.documents().length === 0);

  protected deleteTarget = signal<Document | null>(null);
  protected deleting = signal(false);

  constructor() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.loading.set(true);
    this.error.set(null);
    this.documentService.getAll().subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load documents. Make sure the server is running.');
        this.loading.set(false);
      },
    });
  }

  confirmDelete(doc: Document) {
    this.deleteTarget.set(doc);
  }

  cancelDelete() {
    this.deleteTarget.set(null);
  }

  doDelete() {
    const doc = this.deleteTarget();
    if (!doc) return;

    this.deleting.set(true);
    this.documentService.delete(doc.id).subscribe({
      next: () => {
        this.documents.set(this.documents().filter((d) => d.id !== doc.id));
        this.deleteTarget.set(null);
        this.deleting.set(false);
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }
}
