import { CARD_TRANSACTION_MODE_LABELS, CardTransactionMode, TransactionMethodType } from '../models/transaction-method.model';

export interface PaymentMethodLabelInput {
  name: string;
  methodType: TransactionMethodType;
  cardMode: CardTransactionMode | null;
}

export function paymentMethodLabel(input: PaymentMethodLabelInput): string {
  if (input.methodType === 'CARD' && input.cardMode) {
    return `${input.name} (${CARD_TRANSACTION_MODE_LABELS[input.cardMode]})`;
  }
  return input.name;
}
