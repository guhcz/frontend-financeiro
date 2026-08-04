export type PaymentMethod =
  | 'PIX'
  | 'CASH'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'BOLETO'
  | 'OTHER';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: 'Pix',
  CASH: 'Dinheiro',
  DEBIT_CARD: 'Cartão de Débito',
  CREDIT_CARD: 'Cartão de Crédito',
  BANK_TRANSFER: 'Transferência Bancária',
  BOLETO: 'Boleto',
  OTHER: 'Outro',
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  'PIX',
  'CASH',
  'DEBIT_CARD',
  'CREDIT_CARD',
  'BANK_TRANSFER',
  'BOLETO',
  'OTHER',
];
