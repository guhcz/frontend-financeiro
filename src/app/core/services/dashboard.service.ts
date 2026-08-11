import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { DashboardResponse } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = `${API_BASE_URL}/dashboard`;

  constructor(private readonly http: HttpClient) {}

  getDashboard(month: number, year: number): Observable<DashboardResponse> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get<DashboardResponse>(this.baseUrl, { params });
  }
}
