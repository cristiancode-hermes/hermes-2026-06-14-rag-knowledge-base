import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'documents',
    loadComponent: () => import('./pages/document-list/document-list.component').then((m) => m.DocumentListComponent),
  },
  {
    path: 'documents/new',
    loadComponent: () => import('./pages/document-form/document-form.component').then((m) => m.DocumentFormComponent),
  },
  {
    path: 'documents/:id',
    loadComponent: () => import('./pages/document-detail/document-detail.component').then((m) => m.DocumentDetailComponent),
  },
  {
    path: 'query',
    loadComponent: () => import('./pages/query/query.component').then((m) => m.QueryComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search-history/search-history.component').then((m) => m.SearchHistoryComponent),
  },
];
