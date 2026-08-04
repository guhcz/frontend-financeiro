import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  imports: [],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  icon = input<string>('📭');
  title = input.required<string>();
  description = input<string>('');
  actionLabel = input<string>('');
  action = output<void>();
}
