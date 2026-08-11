import { Component, input, output, signal } from '@angular/core';
import { RecurringUpdateScope } from '../../../core/models/recurring-update-scope.model';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-recurring-delete-scope-modal',
  imports: [Modal],
  templateUrl: './recurring-delete-scope-modal.html',
  styleUrl: './recurring-delete-scope-modal.scss',
})
export class RecurringDeleteScopeModal {
  title = input('Como deseja excluir esta despesa?');
  onlyThisLabel = input('Excluir somente esta despesa');
  onlyThisDescription = input('Remove apenas o lançamento deste mês.');
  thisAndFutureLabel = input('Excluir esta e encerrar as próximas');
  thisAndFutureDescription = input('Remove este lançamento e impede que novas despesas sejam geradas.');

  confirmed = output<RecurringUpdateScope>();
  cancelled = output<void>();

  readonly scope = signal<RecurringUpdateScope>('ONLY_THIS');

  confirm(): void {
    this.confirmed.emit(this.scope());
  }
}
