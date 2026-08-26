import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

const TOKEN_KEY = 'meufinanceiro.token';
const EXPIRES_AT_KEY = 'meufinanceiro.expiresAt';
const REFRESH_TOKEN_KEY = 'meufinanceiro.refreshToken';
const REFRESH_EXPIRES_AT_KEY = 'meufinanceiro.refreshExpiresAt';

const refreshedSession = {
  token: 'renewed-token',
  tokenType: 'Bearer',
  expiresIn: 3600000,
  refreshToken: 'renewed-refresh-token',
  refreshExpiresIn: 2592000000,
};

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(TOKEN_KEY, 'valid-token');
    localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + 60000));
    localStorage.setItem(REFRESH_TOKEN_KEY, 'valid-refresh-token');
    localStorage.setItem(REFRESH_EXPIRES_AT_KEY, String(Date.now() + 120000));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches the bearer token to outgoing requests', () => {
    http.get('http://localhost:8080/api/v1/categories').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/v1/categories');
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
    req.flush([]);
  });

  it('renews the session and retries the protected request when the access token expired', () => {
    let response: unknown;
    http.get('http://localhost:8080/api/v1/categories').subscribe({
      next: (value) => (response = value),
      error: () => {},
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/categories');
    req.flush(
      { status: 401, title: 'Unauthorized', detail: 'Access token expired', code: 'TOKEN_EXPIRED' },
      { status: 401, statusText: 'Unauthorized' },
    );

    const refreshReq = httpMock.expectOne('http://localhost:8080/api/v1/auth/refresh');
    expect(refreshReq.request.headers.has('Authorization')).toBe(false);
    expect(refreshReq.request.body).toEqual({ refreshToken: 'valid-refresh-token' });
    refreshReq.flush(refreshedSession);

    const retryReq = httpMock.expectOne('http://localhost:8080/api/v1/categories');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer renewed-token');
    retryReq.flush([]);

    expect(response).toEqual([]);
    expect(authService.token).toBe('renewed-token');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('renewed-token');
  });

  it('clears the session when the access token is invalid', () => {
    http.get('http://localhost:8080/api/v1/categories').subscribe({ error: () => {} });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/categories');
    req.flush(
      { status: 401, title: 'Unauthorized', detail: 'Invalid access token', code: 'INVALID_TOKEN' },
      { status: 401, statusText: 'Unauthorized' },
    );

    httpMock.expectNone('http://localhost:8080/api/v1/auth/refresh');
    expect(authService.token).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('does not clear the session for a server error', () => {
    http.get('http://localhost:8080/api/v1/categories').subscribe({ error: () => {} });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/categories');
    req.flush({ status: 500, detail: 'Internal error' }, { status: 500, statusText: 'Server Error' });

    expect(authService.token).toBe('valid-token');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('valid-refresh-token');
  });

  it('shares one refresh request between simultaneous expired requests', () => {
    http.get('http://localhost:8080/api/v1/categories').subscribe();
    http.get('http://localhost:8080/api/v1/transactions').subscribe();

    const initialRequests = httpMock.match(
      (request) => request.url.endsWith('/categories') || request.url.endsWith('/transactions'),
    );
    expect(initialRequests.length).toBe(2);
    for (const request of initialRequests) {
      request.flush(
        { status: 401, title: 'Unauthorized', detail: 'Access token expired', code: 'TOKEN_EXPIRED' },
        { status: 401, statusText: 'Unauthorized' },
      );
    }

    const refreshRequests = httpMock.match('http://localhost:8080/api/v1/auth/refresh');
    expect(refreshRequests.length).toBe(1);
    refreshRequests[0].flush(refreshedSession);

    const retriedRequests = httpMock.match(
      (request) => request.url.endsWith('/categories') || request.url.endsWith('/transactions'),
    );
    expect(retriedRequests.length).toBe(2);
    for (const request of retriedRequests) {
      expect(request.request.headers.get('Authorization')).toBe('Bearer renewed-token');
      request.flush([]);
    }
  });

  it('does not clear the session on a 401 from the login endpoint', () => {
    http.post('http://localhost:8080/api/v1/auth/login', { email: 'a@a.com', password: 'x' }).subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/login');
    req.flush(
      { status: 401, title: 'Unauthorized', detail: 'Invalid credentials' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(authService.token).toBe('valid-token');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('valid-token');
  });
});
