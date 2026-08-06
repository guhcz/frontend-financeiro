import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Page } from '../models/page.model';
import {
  RecurringExpense,
  RecurringExpenseFilters,
  RecurringExpenseRequest,
  RecurringExpenseUpdateRequest,
} from '../models/recurring-expense.model';

@Injectable({ providedIn: 'root' })
export class RecurringExpenseService {
  private readonly baseUrl = `${API_BASE_URL}/recurring-expenses`;

  constructor(private readonly http: HttpClient) {}

  list(filters: RecurringExpenseFilters): Observable<Page<RecurringExpense>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Page<RecurringExpense>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<RecurringExpense> {
    return this.http.get<RecurringExpense>(`${this.baseUrl}/${id}`);
  }

  create(request: RecurringExpenseRequest): Observable<RecurringExpense> {
    return this.http.post<RecurringExpense>(this.baseUrl, request);
  }

  update(id: number, request: RecurringExpenseUpdateRequest): Observable<RecurringExpense> {
    return this.http.put<RecurringExpense>(`${this.baseUrl}/${id}`, request);
  }

  pause(id: number): Observable<RecurringExpense> {
    return this.http.patch<RecurringExpense>(`${this.baseUrl}/${id}/pause`, {});
  }

  resume(id: number): Observable<RecurringExpense> {
    return this.http.patch<RecurringExpense>(`${this.baseUrl}/${id}/resume`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
