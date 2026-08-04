import { Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  private readonly notificationService = inject(NotificationService);
  readonly toasts = this.notificationService.toasts;

  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}
