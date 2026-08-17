import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ExpenseEvolutionPoint } from '../../../core/models/planning.model';

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 130;
const MARGIN = { top: 12, right: 16, bottom: 24, left: 56 };
const PLOT_WIDTH = VIEW_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = VIEW_HEIGHT - MARGIN.top - MARGIN.bottom;

interface ChartPoint {
  day: number;
  date: string;
  accumulatedAmount: number;
  x: number;
  y: number;
  xPct: number;
  yPct: number;
}

function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const exponent = Math.floor(Math.log10(rough));
  const base = Math.pow(10, exponent);
  const fraction = rough / base;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * base;
}

function computeDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

@Component({
  selector: 'app-expense-evolution-chart',
  imports: [CurrencyPipe, LucideAngularModule],
  templateUrl: './expense-evolution-chart.html',
  styleUrl: './expense-evolution-chart.scss',
})
export class ExpenseEvolutionChart {
  data = input.required<ExpenseEvolutionPoint[]>();
  monthlyLimit = input<number | null>(null);
  month = input.required<number>();
  year = input.required<number>();
  loading = input(false);
  error = input<string | null>(null);

  readonly viewWidth = VIEW_WIDTH;
  readonly viewHeight = VIEW_HEIGHT;
  readonly margin = MARGIN;

  readonly hoveredIndex = signal<number | null>(null);

  private readonly normalizedData = computed<ExpenseEvolutionPoint[]>(() => {
    const sorted = [...this.data()].sort((a, b) => a.date.localeCompare(b.date));
    let accumulated = 0;
    return sorted.map((item) => {
      const dailyAmount = Number(item.dailyAmount);
      const apiAccumulated = Number(item.accumulatedAmount);

      if (Number.isFinite(dailyAmount) && dailyAmount > 0) {
        accumulated += dailyAmount;
      } else if (Number.isFinite(apiAccumulated)) {
        accumulated = Math.max(accumulated, apiAccumulated);
      }

      return { ...item, accumulatedAmount: accumulated };
    });
  });

  private readonly daysInMonth = computed(() => computeDaysInMonth(this.month(), this.year()));

  private readonly niceMax = computed(() => {
    const values = this.normalizedData().map((d) => d.accumulatedAmount);
    const rawMax = Math.max(...values, this.monthlyLimit() ?? 0, 1);
    return niceStep(rawMax / 4) * 4;
  });

  readonly yTicks = computed(() => {
    const step = this.niceMax() / 4;
    return [0, 1, 2, 3, 4].map((i) => i * step);
  });

  readonly xTicks = computed(() => {
    const total = this.daysInMonth();
    const ticks = [1];
    for (let d = 5; d <= total; d += 5) ticks.push(d);
    if (total - ticks[ticks.length - 1] >= 3) ticks.push(total);
    return ticks;
  });

  readonly points = computed<ChartPoint[]>(() => {
    const total = this.daysInMonth();
    const max = this.niceMax();
    let previousDay = 0;
    return this.normalizedData().map((item) => {
      const originalDay = Number(item.date.slice(8, 10));
      const day = clamp(Math.max(originalDay, previousDay + 1), 1, total);
      previousDay = day;
      const x = this.xForDay(day, total);
      const y = this.yForValue(item.accumulatedAmount, max);
      return {
        day,
        date: item.date,
        accumulatedAmount: item.accumulatedAmount,
        x,
        y,
        xPct: (x / VIEW_WIDTH) * 100,
        yPct: (y / VIEW_HEIGHT) * 100,
      };
    });
  });

  readonly linePath = computed(() =>
    this.points()
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' '),
  );

  readonly limitY = computed(() => {
    const limit = this.monthlyLimit();
    return limit === null ? null : this.yForValue(limit, this.niceMax());
  });

  readonly lastPoint = computed(() => {
    const pts = this.points();
    return pts.length > 0 ? pts[pts.length - 1] : null;
  });

  readonly hoveredPoint = computed(() => {
    const index = this.hoveredIndex();
    return index === null ? null : this.points()[index];
  });

  onPointerMove(event: PointerEvent): void {
    const points = this.points();
    if (points.length === 0) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const fraction = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const svgX = fraction * VIEW_WIDTH;
    const plotFraction = clamp((svgX - MARGIN.left) / PLOT_WIDTH, 0, 1);
    const total = this.daysInMonth();
    const targetDay = 1 + plotFraction * (total - 1);

    let nearestIndex = 0;
    let nearestDistance = Infinity;
    points.forEach((point, i) => {
      const distance = Math.abs(point.day - targetDay);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    });
    this.hoveredIndex.set(nearestIndex);
  }

  onPointerLeave(): void {
    this.hoveredIndex.set(null);
  }

  xLabel(day: number): string {
    return `${pad2(day)}/${pad2(this.month())}`;
  }

  yForTick(tick: number): number {
    return this.yForValue(tick, this.niceMax());
  }

  xForTick(day: number): number {
    return this.xForDay(day, this.daysInMonth());
  }

  endLabelX(point: ChartPoint): number {
    return point.x <= MARGIN.left + 48 ? point.x + 8 : point.x;
  }

  endLabelAnchor(point: ChartPoint): 'start' | 'end' {
    return point.x <= MARGIN.left + 48 ? 'start' : 'end';
  }

  endLabelY(point: ChartPoint): number {
    return Math.max(point.y - 10, MARGIN.top + 10);
  }

  private xForDay(day: number, totalDays: number): number {
    if (totalDays <= 1) return MARGIN.left;
    return MARGIN.left + ((day - 1) / (totalDays - 1)) * PLOT_WIDTH;
  }

  private yForValue(value: number, max: number): number {
    if (max <= 0) return MARGIN.top + PLOT_HEIGHT;
    return MARGIN.top + PLOT_HEIGHT - (value / max) * PLOT_HEIGHT;
  }
}
