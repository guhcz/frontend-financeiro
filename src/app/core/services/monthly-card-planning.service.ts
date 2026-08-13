import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  MonthlyCardPlanningFilters,
  MonthlyCardPlanningItem,
  MonthlyCardPlanningRequest,
} from '../models/monthly-card-planning.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class MonthlyCardPlanningService {
  private readonly baseUrl = `${API_BASE_URL}/monthly-card-plannings`;

  constructor(private readonly http: HttpClient) {}

  list(filters: MonthlyCardPlanningFilters): Observable<Page<MonthlyCardPlanningItem>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Page<MonthlyCardPlanningItem>>(this.baseUrl, { params });
  }

  create(request: MonthlyCardPlanningRequest): Observable<void> {
    return this.http.post<void>(this.baseUrl, request);
  }

  update(id: number, request: MonthlyCardPlanningRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
