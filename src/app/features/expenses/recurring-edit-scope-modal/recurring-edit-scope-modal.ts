import { Component, output, signal } from '@angular/core';
import { RecurringUpdateScope } from '../../../core/models/recurring-update-scope.model';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-recurring-edit-scope-modal',
  imports: [Modal],
  templateUrl: './recurring-edit-scope-modal.html',
  styleUrl: './recurring-edit-scope-modal.scss',
})
export class RecurringEditScopeModal {
  confirmed = output<RecurringUpdateScope>();
  cancelled = output<void>();

  readonly scope = signal<RecurringUpdateScope>('ONLY_THIS');

  confirm(): void {
    this.confirmed.emit(this.scope());
  }
}
