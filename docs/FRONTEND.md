# Frontend Architecture

## Tech Stack

- **Angular 22** — Standalone components, signals, zoneless change detection
- **Tailwind CSS 4** — Utility-first styling, no component CSS files
- **TypeScript 6** — Latest TypeScript features
- **Vite** — Build tool via Angular CLI

---

## Signal Architecture

All state in the application is managed through Angular signals. Here is where each piece of state lives:

### Auth State (`AuthService` — singleton)

```typescript
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(localStorage.getItem('token'));
  private isAuthenticatedSignal = computed(() => this.tokenSignal() !== null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal;
}
```

- **Token** is loaded from `localStorage` on service construction
- **Token** is persisted to `localStorage` on every login/register
- **Token** is removed from `localStorage` on logout
- **Current user** is restored via `GET /auth/me` if a token exists on page load
- **`isAuthenticated`** is a computed signal — it automatically stays in sync

### Document State (per-component via `signal()`)

Each document-related page manages its own signals:

| Component | Signals | Source |
|-----------|---------|--------|
| `DocumentListComponent` | `documents`, `loading`, `error`, `isEmpty` | `DocumentService.getAll()` |
| `DocumentDetailComponent` | `document`, `loading`, `error`, `rechunking` | `DocumentService.getById()` |
| `DocumentFormComponent` | `submitting`, `error` | `DocumentService.create()` |

### Query State (`QueryComponent`)

```typescript
protected loadingState = signal<'idle' | 'retrieving' | 'generating'>('idle');
protected answer = signal<string | null>(null);
protected sources = signal<RagSource[]>([]);
protected queryTimeMs = signal<number | null>(null);
protected error = signal<string | null>(null);
protected availableDocuments = signal<Document[]>([]);
protected loading = computed(() => this.loadingState() !== 'idle');
```

The `loadingState` signal has three values representing the query pipeline stages. The `loading` computed signal is derived from `loadingState` and is used to disable UI controls.

---

## Component Tree

```
App (root, <router-outlet>)
├── NavbarComponent (shared, shows auth status + nav links)
├── HomeComponent
│   └── NavbarComponent
├── LoginComponent
│   └── NavbarComponent
├── RegisterComponent
│   └── NavbarComponent
├── DocumentListComponent
│   └── NavbarComponent
├── DocumentFormComponent
│   └── NavbarComponent
├── DocumentDetailComponent
│   └── NavbarComponent
├── QueryComponent
│   └── NavbarComponent
└── SearchHistoryComponent
    └── NavbarComponent
```

Every page is a **standalone component** with its own `@Component({ standalone: true, ... })` decorator. The `NavbarComponent` is imported individually by each page — there is no shared layout wrapper.

---

## Zoneless Change Detection

The application uses `provideZoneChangeDetection({ eventCoalescing: true })` in the app config. This enables Angular's zoneless mode while maintaining backward compatibility.

### How it works

1. **Signals are automatically tracked** — when a signal's value changes, Angular knows which components depend on it
2. **Components update precisely** — only the component that reads a changed signal is re-rendered, not the entire tree
3. **No `OnPush` needed** — signals work with the default change detection strategy
4. **No `markForCheck()`** — signals handle their own change propagation

### What still uses zone.js

- `setTimeout()` calls in `QueryComponent` (500ms simulated delay for UX)
- Angular's Reactive Forms (form state changes trigger zone-based checks)
- Some third-party libraries may rely on zone.js

---

## Loading, Empty, and Error State Pattern

Every data-fetching component follows a consistent three-state pattern:

### Template pattern

```html
<!-- Loading State -->
@if (loading()) {
  <div class="...">
    <svg class="animate-spin ...">...</svg>
  </div>
}

<!-- Error State -->
@if (error()) {
  <div class="bg-red-50 ...">
    <p>{{ error() }}</p>
    <button (click)="loadData()">Try Again</button>
  </div>
}

<!-- Empty State -->
@if (isEmpty()) {
  <div class="text-center ...">
    <h3>No data yet</h3>
    <p>Message explaining what to do.</p>
    <a routerLink="/action">Take Action</a>
  </div>
}

<!-- Data State -->
@if (!loading() && !error() && data().length > 0) {
  <div ...>
    @for (item of data(); track item.id) {
      <!-- item display -->
    }
  </div>
}
```

### Component pattern

```typescript
protected data = signal<DataType[]>([]);
protected loading = signal(true);
protected error = signal<string | null>(null);
protected isEmpty = computed(() => !this.loading() && this.data().length === 0);
```

This pattern ensures:
- Loading, empty, error, and data states are mutually exclusive
- The user always sees a clear state indicator
- Error states include a retry mechanism

---

## Routing (Lazy-Loaded)

All routes use `loadComponent` for lazy loading:

```typescript
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'documents', loadComponent: () => import('./pages/document-list/document-list.component').then(m => m.DocumentListComponent) },
  { path: 'documents/new', loadComponent: () => import('./pages/document-form/document-form.component').then(m => m.DocumentFormComponent) },
  { path: 'documents/:id', loadComponent: () => import('./pages/document-detail/document-detail.component').then(m => m.DocumentDetailComponent) },
  { path: 'query', loadComponent: () => import('./pages/query/query.component').then(m => m.QueryComponent) },
  { path: 'search', loadComponent: () => import('./pages/search-history/search-history.component').then(m => m.SearchHistoryComponent) },
];
```

Each page is a separate JavaScript chunk loaded on demand. There is no auth guard — the API handles authorization with 401 responses, and the UI handles this gracefully.

---

## Auth Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  Login   │────▶│ AuthService  │────▶│  API     │
│  Page    │     │              │     │          │
└──────────┘     │ login()      │     │ /auth/   │
                 │   │          │     │ login    │
                 │   ▼          │     │          │
                 │ localStorage │     │ /auth/   │
                 │ .setItem()   │     │ register │
                 │   │          │     │          │
                 │   ▼          │     │ /auth/me │
                 │ tokenSignal  │     │          │
                 │ .set()       │     └──────────┘
                 │   │          │
                 │   ▼          │     ┌──────────────┐
                 │ currentUser  │     │ authInterceptor│
                 │ .set()       │◀────│ (HttpInterceptorFn)
                 └──────────────┘     │              │
                                      │ Reads token  │
                                      │ from AuthSvc │
                                      │ Adds Bearer  │
                                      │ header       │
                                      └──────────────┘
```

### Interceptor

The `authInterceptor` is a functional HTTP interceptor:

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(cloned);
  }

  return next(req);
};
```

It is registered in `appConfig.providers` via `withInterceptors([authInterceptor])`.

### Token lifecycle

1. **Login/Register:** Token received from API → stored in `localStorage` + `tokenSignal`
2. **Page load:** Token loaded from `localStorage` → `GET /auth/me` to restore user session → on failure, token is cleared
3. **HTTP requests:** Interceptor reads `tokenSignal()` and adds `Authorization` header
4. **Logout:** Token removed from `localStorage` + `tokenSignal.set(null)` + `currentUserSignal.set(null)`

---

## Services

All services follow the same pattern:

```typescript
@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';

  getAll() {
    return this.http.get<Document[]>(`${this.apiUrl}/documents`);
  }

  create(data: { title: string; content: string; source: string }) {
    return this.http.post<Document>(`${this.apiUrl}/documents`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/documents/${id}`);
  }
}
```

| Service | Endpoints | Purpose |
|---------|-----------|---------|
| `AuthService` | `/auth/*` | Login, register, session restore, logout |
| `DocumentService` | `/documents/*` | CRUD operations on documents |
| `ChunkService` | `/documents/:id/chunks` | View and re-chunk documents |
| `RagService` | `/rag/*` | Query the RAG pipeline |
| `SeedService` | `/seed` | Trigger demo data seeding |
