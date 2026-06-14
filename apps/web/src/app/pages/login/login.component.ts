import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../components/navbar.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NavbarComponent],
  template: `
    <app-navbar />
    <div class="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-indigo-50">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p class="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="you@example.com"
            />
            @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
              <p class="text-red-500 text-sm mt-1">Valid email is required</p>
            }
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="••••••••"
            />
            @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
              <p class="text-red-500 text-sm mt-1">Password is required</p>
            }
          </div>

          @if (error()) {
            <div class="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{{ error() }}</div>
          }

          <button
            type="submit"
            [disabled]="loginForm.invalid || loading()"
            class="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            @if (loading()) {
              <span class="flex items-center justify-center space-x-2">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Signing in...</span>
              </span>
            } @else {
              Sign In
            }
          </button>
        </form>

        <p class="text-center mt-6 text-sm text-gray-600">
          Don't have an account?
          <a routerLink="/register" class="text-indigo-600 hover:text-indigo-700 font-medium">Register</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  protected loginForm: FormGroup;
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Invalid email or password');
        this.loading.set(false);
      },
    });
  }
}
