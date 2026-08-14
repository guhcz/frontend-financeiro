import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-modal',
  imports: [LucideAngularModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  title = input.required<string>();
  subtitle = input<string | null>(null);
  wide = input(false);
  icon = input<string | null>(null);
  iconTone = input<'violet' | 'green' | 'orange'>('violet');
  closed = output<void>();

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}
