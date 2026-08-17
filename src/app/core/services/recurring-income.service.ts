import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Page } from '../models/page.model';
import {
  RecurringIncome,
  RecurringIncomeRequest,
  RecurringIncomeUpdateRequest,
  RecurringIncomeFilters,
} from '../models/recurring-income.model';

@Injectable({ providedIn: 'root' })
export class RecurringIncomeService {
  private readonly baseUrl = `${API_BASE_URL}/recurring-incomes`;

  constructor(private readonly http: HttpClient) {}

  create(request: RecurringIncomeRequest): Observable<RecurringIncome> {
    return this.http.post<RecurringIncome>(this.baseUrl, request);
  }

  list(filters: RecurringIncomeFilters): Observable<Page<RecurringIncome>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Page<RecurringIncome>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<RecurringIncome> {
    return this.http.get<RecurringIncome>(`${this.baseUrl}/${id}`);
  }

  update(id: number, request: RecurringIncomeUpdateRequest): Observable<RecurringIncome> {
    return this.http.put<RecurringIncome>(`${this.baseUrl}/${id}`, request);
  }

  pause(id: number): Observable<RecurringIncome> {
    return this.http.patch<RecurringIncome>(`${this.baseUrl}/${id}/pause`, {});
  }

  resume(id: number): Observable<RecurringIncome> {
    return this.http.patch<RecurringIncome>(`${this.baseUrl}/${id}/resume`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
