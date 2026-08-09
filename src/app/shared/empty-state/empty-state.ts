import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-empty-state',
  imports: [LucideAngularModule],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  icon = input<string>('📭');
  lucideIcon = input<string | null>(null);
  title = input.required<string>();
  description = input<string>('');
  actionLabel = input<string>('');
  action = output<void>();
}
