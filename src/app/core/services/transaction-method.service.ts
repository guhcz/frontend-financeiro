import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Page } from '../models/page.model';
import {
  TransactionMethod,
  TransactionMethodCreateRequest,
  TransactionMethodFilters,
  TransactionMethodUpdateRequest,
} from '../models/transaction-method.model';

@Injectable({ providedIn: 'root' })
export class TransactionMethodService {
  private readonly baseUrl = `${API_BASE_URL}/transaction-methods`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<TransactionMethod[]> {
    return this.http.get<TransactionMethod[]>(`${this.baseUrl}/all`);
  }

  listPage(filters: TransactionMethodFilters): Observable<Page<TransactionMethod>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Page<TransactionMethod>>(this.baseUrl, { params });
  }

  create(request: TransactionMethodCreateRequest): Observable<TransactionMethod> {
    return this.http.post<TransactionMethod>(this.baseUrl, request);
  }

  update(id: number, request: TransactionMethodUpdateRequest): Observable<TransactionMethod> {
    return this.http.put<TransactionMethod>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
