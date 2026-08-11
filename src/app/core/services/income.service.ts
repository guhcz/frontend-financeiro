import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Income, IncomeRequest } from '../models/income.model';
import { RecurringUpdateScope } from '../models/recurring-update-scope.model';

@Injectable({ providedIn: 'root' })
export class IncomeService {
  private readonly baseUrl = `${API_BASE_URL}/incomes`;

  constructor(private readonly http: HttpClient) {}

  createIncome(request: IncomeRequest): Observable<Income> {
    return this.http.post<Income>(this.baseUrl, request);
  }

  getIncomeById(id: number): Observable<Income> {
    return this.http.get<Income>(`${this.baseUrl}/${id}`);
  }

  updateIncome(id: number, request: IncomeRequest, scope: RecurringUpdateScope = 'ONLY_THIS'): Observable<Income> {
    const params = new HttpParams().set('scope', scope);
    return this.http.put<Income>(`${this.baseUrl}/${id}`, request, { params });
  }

  deleteIncome(id: number, scope: RecurringUpdateScope = 'ONLY_THIS'): Observable<void> {
    const params = new HttpParams().set('scope', scope);
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }
}
