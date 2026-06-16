import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService, AuthResponse, LoginCredentials, RegisterData } from './auth.service';

describe('AuthService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    const service = TestBed.inject(AuthService);
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should send POST request to /auth/login and store token', () => {
      const service = TestBed.inject(AuthService);
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockResponse: AuthResponse = {
        token: 'jwt-token-123',
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
      };

      service.login(credentials).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(localStorage.getItem('token')).toBe('jwt-token-123');
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);
    });
  });

  describe('register', () => {
    it('should send POST request to /auth/register and store token', () => {
      const service = TestBed.inject(AuthService);
      const data: RegisterData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };
      const mockResponse: AuthResponse = {
        token: 'jwt-token-456',
        user: { id: 2, username: 'newuser', email: 'new@example.com' },
      };

      service.register(data).subscribe((res) => {
        expect(res).toEqual(mockResponse);
        expect(localStorage.getItem('token')).toBe('jwt-token-456');
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush(mockResponse);
    });
  });

  describe('getMe', () => {
    it('should send GET request to /auth/me', () => {
      const service = TestBed.inject(AuthService);
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };

      service.getMe().subscribe((user) => {
        expect(user).toEqual(mockUser as any);
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/me');
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('getToken', () => {
    it('should return null when no token is stored', () => {
      const service = TestBed.inject(AuthService);
      expect(service.getToken()).toBeNull();
    });

    it('should return the stored token', () => {
      localStorage.setItem('token', 'my-token');
      const service = TestBed.inject(AuthService);
      // Constructor calls getMe() when a token exists — flush the request
      const meReq = httpMock.expectOne('http://localhost:3000/auth/me');
      meReq.flush({ id: 1, username: 'testuser', email: 'test@example.com' });
      expect(service.getToken()).toBe('my-token');
    });
  });

  describe('logout', () => {
    it('should clear token and user', () => {
      const service = TestBed.inject(AuthService);
      localStorage.setItem('token', 'some-token');
      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(service.getToken()).toBeNull();
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token', () => {
      const service = TestBed.inject(AuthService);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true when token exists', () => {
      localStorage.setItem('token', 'some-token');
      const service = TestBed.inject(AuthService);
      // Constructor calls getMe() when a token exists — flush the request
      const meReq = httpMock.expectOne('http://localhost:3000/auth/me');
      meReq.flush({ id: 1, username: 'testuser', email: 'test@example.com' });
      expect(service.isAuthenticated()).toBe(true);
    });
  });
});
