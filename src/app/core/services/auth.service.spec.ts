import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

const TOKEN_KEY = 'meufinanceiro.token';
const EXPIRES_AT_KEY = 'meufinanceiro.expiresAt';

describe('AuthService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  function setup(): AuthService {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: 'login', children: [] }])],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  it('stores token and expiry on successful login', () => {
    const authService = setup();

    authService.login('user@example.com', 'password123').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'abc123', tokenType: 'Bearer', expiresIn: 3600000 });

    expect(authService.token).toBe('abc123');
    expect(authService.isAuthenticated()).toBe(true);
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc123');
    expect(Number(localStorage.getItem(EXPIRES_AT_KEY))).toBeGreaterThan(Date.now());
  });

  it('clears session on logout', () => {
    const authService = setup();

    authService.login('user@example.com', 'password123').subscribe();
    httpMock.expectOne('http://localhost:8080/api/v1/auth/login').flush({
      token: 'abc123',
      tokenType: 'Bearer',
      expiresIn: 3600000,
    });

    authService.logout();

    expect(authService.token).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('discards an already-expired session found in storage on bootstrap', () => {
    localStorage.setItem(TOKEN_KEY, 'expired-token');
    localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() - 1000));

    const authService = setup();

    expect(authService.token).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('keeps a still-valid session found in storage on bootstrap', () => {
    localStorage.setItem(TOKEN_KEY, 'valid-token');
    localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + 60000));

    const authService = setup();

    expect(authService.token).toBe('valid-token');
    expect(authService.isAuthenticated()).toBe(true);
  });
});
