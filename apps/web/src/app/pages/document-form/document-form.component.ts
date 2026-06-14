import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { NavbarComponent } from '../../components/navbar.component';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NavbarComponent],
  template: `
    <app-navbar />
    <main class="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-indigo-50">
      <div class="max-w-3xl mx-auto px-4 py-8">
        <div class="flex items-center space-x-3 mb-8">
          <a routerLink="/documents" class="text-gray-500 hover:text-gray-700 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </a>
          <h1 class="text-3xl font-bold text-gray-900">New Document</h1>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-8 border border-indigo-50">
          <form [formGroup]="documentForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                id="title"
                type="text"
                formControlName="title"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="Document title"
              />
              @if (documentForm.get('title')?.touched && documentForm.get('title')?.invalid) {
                <p class="text-red-500 text-sm mt-1">Title is required</p>
              }
            </div>

            <div>
              <label for="source" class="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                id="source"
                formControlName="source"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-white"
              >
                <option value="manual">Manual Entry</option>
                <option value="upload">Upload</option>
                <option value="web">Web Scrape</option>
                <option value="api">API</option>
              </select>
            </div>

            <div>
              <label for="content" class="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                id="content"
                formControlName="content"
                rows="12"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-y font-mono text-sm"
                placeholder="Enter document content here..."
              ></textarea>
              @if (documentForm.get('content')?.touched && documentForm.get('content')?.invalid) {
                <p class="text-red-500 text-sm mt-1">Content is required</p>
              }
            </div>

            @if (error()) {
              <div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{{ error() }}</div>
            }

            <div class="flex justify-end space-x-3 pt-2">
              <a routerLink="/documents" class="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</a>
              <button
                type="submit"
                [disabled]="documentForm.invalid || submitting()"
                class="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                @if (submitting()) {
                  <span class="flex items-center space-x-2">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Creating...</span>
                  </span>
                } @else {
                  Create Document
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  `,
})
export class DocumentFormComponent {
  private fb = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private router = inject(Router);

  protected documentForm: FormGroup;
  protected submitting = signal(false);
  protected error = signal<string | null>(null);

  constructor() {
    this.documentForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      source: ['manual', Validators.required],
    });
  }

  onSubmit() {
    if (this.documentForm.invalid) return;

    this.submitting.set(true);
    this.error.set(null);

    this.documentService.create(this.documentForm.value).subscribe({
      next: () => {
        this.router.navigate(['/documents']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create document');
        this.submitting.set(false);
      },
    });
  }
}
