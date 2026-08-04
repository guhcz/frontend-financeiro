import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class Pagination {
  page = input.required<number>();
  totalPages = input.required<number>();
  totalElements = input.required<number>();
  size = input.required<number>();
  first = input.required<boolean>();
  last = input.required<boolean>();
  itemLabel = input<string>('resultados');

  pageChange = output<number>();
  sizeChange = output<number>();

  readonly pageSizeOptions = [5, 10, 20, 50];

  readonly rangeStart = computed(() => (this.totalElements() === 0 ? 0 : this.page() * this.size() + 1));
  readonly rangeEnd = computed(() => Math.min((this.page() + 1) * this.size(), this.totalElements()));

  readonly pageNumbers = computed<(number | 'ellipsis')[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }
    const pages = new Set<number>([0, total - 1, current, current - 1, current + 1]);
    const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
    const result: (number | 'ellipsis')[] = [];
    let prev: number | null = null;
    for (const p of sorted) {
      if (prev !== null && p - prev > 1) {
        result.push('ellipsis');
      }
      result.push(p);
      prev = p;
    }
    return result;
  });

  goTo(p: number): void {
    if (p >= 0 && p < this.totalPages() && p !== this.page()) {
      this.pageChange.emit(p);
    }
  }

  onSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.sizeChange.emit(value);
  }
}
