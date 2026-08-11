import { Component, input, output, signal } from '@angular/core';
import { RecurringUpdateScope } from '../../../core/models/recurring-update-scope.model';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-recurring-edit-scope-modal',
  imports: [Modal],
  templateUrl: './recurring-edit-scope-modal.html',
  styleUrl: './recurring-edit-scope-modal.scss',
})
export class RecurringEditScopeModal {
  title = input('O que você deseja alterar?');
  onlyThisLabel = input('Somente esta despesa');
  onlyThisDescription = input(
    'Altera apenas o lançamento selecionado. Os próximos meses continuarão com os dados atuais da recorrência.',
  );
  thisAndFutureLabel = input('Esta e as próximas despesas');
  thisAndFutureDescription = input('Altera este lançamento e atualiza a regra usada para gerar os próximos meses.');

  confirmed = output<RecurringUpdateScope>();
  cancelled = output<void>();

  readonly scope = signal<RecurringUpdateScope>('ONLY_THIS');

  confirm(): void {
    this.confirmed.emit(this.scope());
  }
}
