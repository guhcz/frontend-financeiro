import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Page } from '../models/page.model';
import { TransactionFilters, TransactionListItem } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly baseUrl = `${API_BASE_URL}/transactions`;

  constructor(private readonly http: HttpClient) {}

  getTransactions(filters: TransactionFilters): Observable<Page<TransactionListItem>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Page<TransactionListItem>>(this.baseUrl, { params });
  }

  getAllTransactions(filters: TransactionFilters, pageSize = 200): Observable<TransactionListItem[]> {
    const firstPage = { ...filters, page: 0, size: pageSize };

    return this.getTransactions(firstPage).pipe(
      expand((page) =>
        page.last
          ? EMPTY
          : this.getTransactions({ ...filters, page: page.number + 1, size: pageSize }),
      ),
      map((page) => page.content),
      reduce((items, pageItems) => [...items, ...pageItems], [] as TransactionListItem[]),
    );
  }
}
