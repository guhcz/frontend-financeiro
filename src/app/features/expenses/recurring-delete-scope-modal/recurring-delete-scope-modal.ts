import { Component, output, signal } from '@angular/core';
import { RecurringUpdateScope } from '../../../core/models/recurring-update-scope.model';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-recurring-delete-scope-modal',
  imports: [Modal],
  templateUrl: './recurring-delete-scope-modal.html',
  styleUrl: './recurring-delete-scope-modal.scss',
})
export class RecurringDeleteScopeModal {
  confirmed = output<RecurringUpdateScope>();
  cancelled = output<void>();

  readonly scope = signal<RecurringUpdateScope>('ONLY_THIS');

  confirm(): void {
    this.confirmed.emit(this.scope());
  }
}
