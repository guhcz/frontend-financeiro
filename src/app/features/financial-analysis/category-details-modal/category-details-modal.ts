import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { ExpenseByCategory } from '../../../core/models/financial-analysis.model';
import { Modal } from '../../../shared/modal/modal';
import { Pagination } from '../../../shared/pagination/pagination';

type CategorySort = 'amount-desc' | 'amount-asc' | 'name-asc';

@Component({
  selector: 'app-category-details-modal',
  imports: [CurrencyPipe, DecimalPipe, Modal, Pagination],
  templateUrl: './category-details-modal.html',
  styleUrl: './category-details-modal.scss',
})
export class CategoryDetailsModal {
  data = input.required<ExpenseByCategory[]>();
  closed = output<void>();

  readonly search = signal('');
  readonly sort = signal<CategorySort>('amount-desc');
  readonly page = signal(0);
  readonly size = signal(5);

  readonly totalAmount = computed(() => this.data().reduce((sum, item) => sum + item.amount, 0));

  readonly filtered = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('pt-BR');
    const rows = this.data().filter((item) => item.category.name.toLocaleLowerCase('pt-BR').includes(term));
    return [...rows].sort((a, b) => {
      if (this.sort() === 'amount-asc') return a.amount - b.amount;
      if (this.sort() === 'name-asc') return a.category.name.localeCompare(b.category.name, 'pt-BR');
      return b.amount - a.amount;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.size())));
  readonly rows = computed(() => {
    const start = this.page() * this.size();
    return this.filtered().slice(start, start + this.size());
  });

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(0);
  }

  onSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as CategorySort);
    this.page.set(0);
  }

  onPageChange(page: number): void {
    this.page.set(page);
  }

  onSizeChange(size: number): void {
    this.size.set(size);
    this.page.set(0);
  }
}
