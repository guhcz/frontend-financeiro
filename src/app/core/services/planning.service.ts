import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { CategoryExpense, ExpenseEvolutionPoint, PlanningSummary } from '../models/planning.model';

@Injectable({ providedIn: 'root' })
export class PlanningService {
  private readonly baseUrl = `${API_BASE_URL}/planning`;

  constructor(private readonly http: HttpClient) {}

  getSummary(month: number, year: number): Observable<PlanningSummary> {
    return this.http.get<PlanningSummary>(`${this.baseUrl}/summary`, { params: this.periodParams(month, year) });
  }

  getExpensesByCategory(month: number, year: number): Observable<CategoryExpense[]> {
    return this.http.get<CategoryExpense[]>(`${this.baseUrl}/expenses-by-category`, {
      params: this.periodParams(month, year),
    });
  }

  getExpenseEvolution(month: number, year: number): Observable<ExpenseEvolutionPoint[]> {
    return this.http.get<ExpenseEvolutionPoint[]>(`${this.baseUrl}/expense-evolution`, {
      params: this.periodParams(month, year),
    });
  }

  private periodParams(month: number, year: number): HttpParams {
    return new HttpParams().set('month', month).set('year', year);
  }
}
