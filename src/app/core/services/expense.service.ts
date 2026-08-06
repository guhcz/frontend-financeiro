import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Expense, ExpenseFilters, ExpenseRequest } from '../models/expense.model';
import { Page } from '../models/page.model';
import { RecurringUpdateScope } from '../models/recurring-update-scope.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly baseUrl = `${API_BASE_URL}/expenses`;

  constructor(private readonly http: HttpClient) {}

  list(filters: ExpenseFilters): Observable<Page<Expense>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Page<Expense>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.baseUrl}/${id}`);
  }

  create(request: ExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(this.baseUrl, request);
  }

  update(id: number, request: ExpenseRequest, scope: RecurringUpdateScope = 'ONLY_THIS'): Observable<Expense> {
    const params = new HttpParams().set('scope', scope);
    return this.http.put<Expense>(`${this.baseUrl}/${id}`, request, { params });
  }

  delete(id: number, scope: RecurringUpdateScope = 'ONLY_THIS'): Observable<void> {
    const params = new HttpParams().set('scope', scope);
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }
}
