import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  RecurringIncome,
  RecurringIncomeRequest,
  RecurringIncomeUpdateRequest,
} from '../models/recurring-income.model';

@Injectable({ providedIn: 'root' })
export class RecurringIncomeService {
  private readonly baseUrl = `${API_BASE_URL}/recurring-incomes`;

  constructor(private readonly http: HttpClient) {}

  create(request: RecurringIncomeRequest): Observable<RecurringIncome> {
    return this.http.post<RecurringIncome>(this.baseUrl, request);
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
