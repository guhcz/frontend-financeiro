import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { LoginRequest, LoginResponse, RefreshTokenRequest } from '../models/auth.model';
import { RegisterRequest, RegisterResponse } from '../models/user.model';

export type CurrentUser = RegisterResponse;

const TOKEN_KEY = 'meufinanceiro.token';
const EXPIRES_AT_KEY = 'meufinanceiro.expiresAt';
const REFRESH_TOKEN_KEY = 'meufinanceiro.refreshToken';
const REFRESH_EXPIRES_AT_KEY = 'meufinanceiro.refreshExpiresAt';

interface StoredSession {
  token: string | null;
  refreshToken: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly initialSession = this.readInitialSession();
  private readonly tokenSignal = signal<string | null>(this.initialSession.token);
  private readonly refreshTokenSignal = signal<string | null>(this.initialSession.refreshToken);
  private refreshRequest$: Observable<string> | null = null;
  readonly isAuthenticated = computed(() => !!this.tokenSignal() || !!this.refreshTokenSignal());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  get token(): string | null {
    return this.tokenSignal();
  }

  get canRefresh(): boolean {
    return !!this.refreshTokenSignal();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, password };
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/login`, body).pipe(
      tap((response) => this.storeSession(response)),
    );
  }

  register(name: string, email: string, password: string): Observable<RegisterResponse> {
    const body: RegisterRequest = { name, email, password };
    return this.http.post<RegisterResponse>(`${API_BASE_URL}/users/register`, body);
  }

  getCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${API_BASE_URL}/users/me`);
  }

  refreshSession(): Observable<string> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const refreshToken = this.refreshTokenSignal();
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token unavailable'));
    }

    const body: RefreshTokenRequest = { refreshToken };
    this.refreshRequest$ = this.http.post<LoginResponse>(`${API_BASE_URL}/auth/refresh`, body).pipe(
      tap((response) => this.storeSession(response)),
      map((response) => response.token),
      finalize(() => (this.refreshRequest$ = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshRequest$;
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  expireSession(): boolean {
    const hadSession = this.isAuthenticated();
    this.clearSession();
    if (hadSession) {
      this.router.navigate(['/login']);
    }
    return hadSession;
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_EXPIRES_AT_KEY);
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
  }

  private storeSession(response: LoginResponse): void {
    const expiresAt = Date.now() + response.expiresIn;
    const refreshExpiresAt = Date.now() + response.refreshExpiresIn;
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(REFRESH_EXPIRES_AT_KEY, String(refreshExpiresAt));
    this.tokenSignal.set(response.token);
    this.refreshTokenSignal.set(response.refreshToken);
  }

  private readInitialSession(): StoredSession {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY));
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const refreshExpiresAt = Number(localStorage.getItem(REFRESH_EXPIRES_AT_KEY));
    const now = Date.now();

    if (!refreshToken || !refreshExpiresAt || now >= refreshExpiresAt) {
      this.clearStoredSession();
      return { token: null, refreshToken: null };
    }

    if (!token || !expiresAt || now >= expiresAt) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRES_AT_KEY);
      return { token: null, refreshToken };
    }

    return { token, refreshToken };
  }

  private clearStoredSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_EXPIRES_AT_KEY);
  }
}
