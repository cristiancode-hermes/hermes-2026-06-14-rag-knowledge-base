import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-8">
            <a routerLink="/" class="flex items-center space-x-2 text-xl font-bold tracking-tight">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
              <span>RAG Knowledge Base</span>
            </a>
            <div class="hidden md:flex items-center space-x-4">
              <a routerLink="/" routerLinkActive="text-yellow-300" [routerLinkActiveOptions]="{exact: true}" class="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/10">Home</a>
              <a routerLink="/documents" routerLinkActive="text-yellow-300" class="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/10">Documents</a>
              <a routerLink="/query" routerLinkActive="text-yellow-300" class="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/10">Query</a>
              <a routerLink="/search" routerLinkActive="text-yellow-300" class="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-white/10">History</a>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            @if (authService.isAuthenticated()) {
              <span class="text-sm text-purple-200">{{ authService.currentUser()?.username }}</span>
              <button (click)="authService.logout()" class="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors">
                Logout
              </button>
            } @else {
              <a routerLink="/login" routerLinkActive="text-yellow-300" class="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors">Login</a>
              <a routerLink="/register" class="px-3 py-1.5 text-sm bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-md transition-colors font-medium">Register</a>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  protected authService = inject(AuthService);
}
