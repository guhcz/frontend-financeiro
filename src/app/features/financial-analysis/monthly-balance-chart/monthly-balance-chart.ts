import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { MonthlyBalancePoint } from '../../../core/models/financial-analysis.model';
import { monthShortLabel, monthYearLabel } from '../../../core/utils/month-label.util';

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 180;
const MARGIN = { top: 16, right: 16, bottom: 32, left: 64 };
const PLOT_WIDTH = VIEW_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = VIEW_HEIGHT - MARGIN.top - MARGIN.bottom;

interface ChartPoint {
  month: number;
  year: number;
  label: string;
  fullLabel: string;
  balance: number;
  x: number;
  y: number;
  xPct: number;
  yPct: number;
  showLabel: boolean;
}

const MAX_VISIBLE_LABELS = 6;

function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const exponent = Math.floor(Math.log10(rough));
  const base = Math.pow(10, exponent);
  const fraction = rough / base;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * base;
}

@Component({
  selector: 'app-monthly-balance-chart',
  imports: [CurrencyPipe],
  templateUrl: './monthly-balance-chart.html',
  styleUrl: './monthly-balance-chart.scss',
})
export class MonthlyBalanceChart {
  data = input.required<MonthlyBalancePoint[]>();
  loading = input(false);

  readonly viewWidth = VIEW_WIDTH;
  readonly viewHeight = VIEW_HEIGHT;
  readonly margin = MARGIN;

  readonly hoveredIndex = signal<number | null>(null);

  private readonly sorted = computed(() => [...this.data()].sort((a, b) => a.year - b.year || a.month - b.month));

  private readonly niceMax = computed(() => {
    const balances = this.sorted().map((d) => d.balance);
    return niceStep(Math.max(...balances, 0) / 4) * 4;
  });

  private readonly niceMin = computed(() => {
    const balances = this.sorted().map((d) => d.balance);
    return -niceStep(Math.abs(Math.min(...balances, 0)) / 4) * 4;
  });

  readonly yTicks = computed(() => {
    const max = this.niceMax();
    const min = this.niceMin();
    const step = (max - min) / 4;
    return [0, 1, 2, 3, 4].map((i) => min + i * step);
  });

  readonly zeroY = computed(() => this.yForValue(0));

  readonly points = computed<ChartPoint[]>(() => {
    const items = this.sorted();
    const n = items.length;
    const labelStep = Math.max(1, Math.ceil(n / MAX_VISIBLE_LABELS));
    return items.map((item, i) => {
      const x = n <= 1 ? MARGIN.left + PLOT_WIDTH / 2 : MARGIN.left + (i / (n - 1)) * PLOT_WIDTH;
      const y = this.yForValue(item.balance);
      return {
        month: item.month,
        year: item.year,
        label: monthShortLabel(item.month, item.year),
        fullLabel: monthYearLabel(item.month, item.year),
        balance: item.balance,
        x,
        y,
        xPct: (x / VIEW_WIDTH) * 100,
        yPct: (y / VIEW_HEIGHT) * 100,
        showLabel: i % labelStep === 0 || i === n - 1,
      };
    });
  });

  readonly linePath = computed(() =>
    this.points()
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' '),
  );

  readonly areaPath = computed(() => {
    const points = this.points();
    if (points.length === 0) return '';
    const bottom = VIEW_HEIGHT - MARGIN.bottom;
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    return `${line} L${points.at(-1)!.x.toFixed(2)},${bottom} L${points[0].x.toFixed(2)},${bottom} Z`;
  });

  readonly hoveredPoint = computed(() => {
    const index = this.hoveredIndex();
    return index === null ? null : this.points()[index];
  });

  readonly hasData = computed(() => this.sorted().some((d) => d.incomeAmount > 0 || d.expenseAmount > 0));

  readonly trendText = computed(() => {
    const pts = this.sorted();
    if (pts.length < 2 || !this.hasData()) return null;
    const [first, second] = pts;
    const diff = second.balance - first.balance;
    if (first.balance === 0 || Math.abs(diff) < 0.01) {
      return 'Seu saldo se manteve estável no período.';
    }
    const pct = Math.abs((diff / Math.abs(first.balance)) * 100);
    const direction = diff > 0 ? 'aumentou' : 'diminuiu';
    const firstLabel = monthShortLabel(first.month, first.year).toLowerCase();
    const secondLabel = monthShortLabel(second.month, second.year).toLowerCase();
    return `Seu saldo ${direction} ${pct.toFixed(0)}% de ${firstLabel} para ${secondLabel}.`;
  });

  yForTick(tick: number): number {
    return this.yForValue(tick);
  }

  private yForValue(value: number): number {
    const max = this.niceMax();
    const min = this.niceMin();
    const range = max - min || 1;
    return MARGIN.top + ((max - value) / range) * PLOT_HEIGHT;
  }
}
