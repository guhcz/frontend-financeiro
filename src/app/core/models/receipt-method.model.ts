export type ReceiptMethod = 'PIX' | 'CASH' | 'BANK_TRANSFER' | 'DEPOSIT' | 'OTHER';

export const RECEIPT_METHOD_LABELS: Record<ReceiptMethod, string> = {
  PIX: 'Pix',
  CASH: 'Dinheiro',
  BANK_TRANSFER: 'Transferência Bancária',
  DEPOSIT: 'Depósito',
  OTHER: 'Outro',
};

export const RECEIPT_METHODS: ReceiptMethod[] = ['PIX', 'CASH', 'BANK_TRANSFER', 'DEPOSIT', 'OTHER'];
