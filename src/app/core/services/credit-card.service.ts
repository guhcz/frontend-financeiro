import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { CreditCard, CreditCardRequest } from '../models/credit-card.model';
import { Page } from '../models/page.model';

export interface CreditCardFilters {
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class CreditCardService {
  private readonly baseUrl = `${API_BASE_URL}/credit-cards`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<CreditCard[]> {
    return this.http.get<CreditCard[]>(`${this.baseUrl}/all`);
  }

  listPage(filters: CreditCardFilters): Observable<Page<CreditCard>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Page<CreditCard>>(this.baseUrl, { params });
  }

  create(request: CreditCardRequest): Observable<CreditCard> {
    return this.http.post<CreditCard>(this.baseUrl, request);
  }

  update(id: number, request: CreditCardRequest): Observable<CreditCard> {
    return this.http.put<CreditCard>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
