import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class SeedService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  trigger() {
    return this.http.post<{ message: string }>(`${this.apiUrl}/seed`, {});
  }
}
