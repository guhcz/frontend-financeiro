import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { LoginRequest, LoginResponse } from '../models/auth.model';
import { RegisterRequest, RegisterResponse } from '../models/user.model';

export type CurrentUser = RegisterResponse;

const TOKEN_KEY = 'meufinanceiro.token';
const EXPIRES_AT_KEY = 'meufinanceiro.expiresAt';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSignal = signal<string | null>(this.readInitialToken());
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  get token(): string | null {
    return this.tokenSignal();
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

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    this.tokenSignal.set(null);
    this.router.navigate(['/login']);
  }

  private storeSession(response: LoginResponse): void {
    const expiresAt = Date.now() + response.expiresIn;
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
    this.tokenSignal.set(response.token);
  }

  private readInitialToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY));
    if (!token || !expiresAt || Date.now() >= expiresAt) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRES_AT_KEY);
      return null;
    }
    return token;
  }
}
