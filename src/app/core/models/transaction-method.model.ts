export type TransactionMethodType = 'PIX' | 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'BOLETO' | 'DEPOSIT' | 'OTHER';

export const TRANSACTION_METHOD_TYPE_LABELS: Record<TransactionMethodType, string> = {
  PIX: 'Pix',
  CASH: 'Dinheiro',
  CARD: 'Cartão',
  BANK_TRANSFER: 'Transferência bancária',
  BOLETO: 'Boleto',
  DEPOSIT: 'Depósito',
  OTHER: 'Outro',
};

export const TRANSACTION_METHOD_TYPES: TransactionMethodType[] = [
  'PIX',
  'CASH',
  'CARD',
  'BANK_TRANSFER',
  'BOLETO',
  'DEPOSIT',
  'OTHER',
];

export type CardTransactionMode = 'CREDIT' | 'DEBIT';

export const CARD_TRANSACTION_MODE_LABELS: Record<CardTransactionMode, string> = {
  CREDIT: 'Crédito',
  DEBIT: 'Débito',
};

export interface TransactionMethodCardDetails {
  closingDay: number;
  dueDay: number;
}

export interface TransactionMethod {
  id: number;
  name: string;
  type: TransactionMethodType;
  active: boolean;
  card: TransactionMethodCardDetails | null;
}

export interface TransactionMethodCreateRequest {
  name: string;
  type: TransactionMethodType;
  card: TransactionMethodCardDetails | null;
}

export interface TransactionMethodUpdateRequest {
  name: string;
  card: TransactionMethodCardDetails | null;
}

export interface TransactionMethodFilters {
  page?: number;
  size?: number;
  sort?: string;
}
