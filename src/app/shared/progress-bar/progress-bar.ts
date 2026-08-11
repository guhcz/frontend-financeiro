import { Component, computed, input } from '@angular/core';

export type ProgressState = 'normal' | 'warning' | 'reached' | 'exceeded';

@Component({
  selector: 'app-progress-bar',
  imports: [],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
})
export class ProgressBar {
  percentage = input.required<number>();
  size = input<'sm' | 'md'>('md');
  variant = input<'auto' | 'violet' | 'amber'>('auto');

  readonly clampedWidth = computed(() => Math.min(Math.max(this.percentage(), 0), 100));

  readonly state = computed<ProgressState>(() => {
    const pct = this.percentage();
    if (pct > 100) return 'exceeded';
    if (pct === 100) return 'reached';
    if (pct >= 80) return 'warning';
    return 'normal';
  });
}
