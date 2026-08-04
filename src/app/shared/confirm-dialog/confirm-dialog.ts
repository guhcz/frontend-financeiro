import { Component, input, output } from '@angular/core';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  title = input<string>('Confirmar ação');
  message = input.required<string>();
  confirmLabel = input<string>('Excluir');
  cancelLabel = input<string>('Cancelar');
  confirmed = output<void>();
  cancelled = output<void>();
}
