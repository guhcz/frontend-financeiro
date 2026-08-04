import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

const TOKEN_KEY = 'meufinanceiro.token';
const EXPIRES_AT_KEY = 'meufinanceiro.expiresAt';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(TOKEN_KEY, 'valid-token');
    localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + 60000));

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

  it('clears the session and does not rethrow silently on a 401 from a protected endpoint', () => {
    http.get('http://localhost:8080/api/v1/categories').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('http://localhost:8080/api/v1/categories');
    req.flush({ status: 401, title: 'Unauthorized', detail: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.token).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
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
