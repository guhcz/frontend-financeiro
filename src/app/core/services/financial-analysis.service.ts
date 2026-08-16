import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  FinancialAnalysisResponse,
  PaymentMethodAnalysisFilters,
  PaymentMethodAnalysisPage,
} from '../models/financial-analysis.model';

@Injectable({ providedIn: 'root' })
export class FinancialAnalysisService {
  private readonly baseUrl = `${API_BASE_URL}/financial-analysis`;

  constructor(private readonly http: HttpClient) {}

  getAnalysis(startDate: string, endDate: string): Observable<FinancialAnalysisResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<FinancialAnalysisResponse>(this.baseUrl, { params });
  }

  getPaymentMethodDetails(filters: PaymentMethodAnalysisFilters): Observable<PaymentMethodAnalysisPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<PaymentMethodAnalysisPage>(`${this.baseUrl}/payment-methods`, { params });
  }
}
