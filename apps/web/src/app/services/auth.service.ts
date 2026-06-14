import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(localStorage.getItem('token'));
  private isAuthenticatedSignal = computed(() => this.tokenSignal() !== null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal;

  constructor() {
    if (this.tokenSignal()) {
      this.getMe().subscribe({
        error: () => this.logout(),
      });
    }
  }

  login(credentials: LoginCredentials) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
        this.tokenSignal.set(res.token);
        this.currentUserSignal.set(res.user);
      })
    );
  }

  register(data: RegisterData) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
        this.tokenSignal.set(res.token);
        this.currentUserSignal.set(res.user);
      })
    );
  }

  getMe() {
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      tap((user) => this.currentUserSignal.set(user)),
      catchError((err) => {
        this.logout();
        return of(null as unknown as User);
      })
    );
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  logout() {
    localStorage.removeItem('token');
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
  }
}
