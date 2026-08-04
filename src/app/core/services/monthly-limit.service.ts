import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { MonthlyLimit, MonthlyLimitRequest } from '../models/monthly-limit.model';

@Injectable({ providedIn: 'root' })
export class MonthlyLimitService {
  private readonly baseUrl = `${API_BASE_URL}/monthly-limits`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<MonthlyLimit[]> {
    return this.http.get<MonthlyLimit[]>(this.baseUrl);
  }

  create(request: MonthlyLimitRequest): Observable<MonthlyLimit> {
    return this.http.post<MonthlyLimit>(this.baseUrl, request);
  }

  update(id: number, request: MonthlyLimitRequest): Observable<MonthlyLimit> {
    return this.http.put<MonthlyLimit>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
