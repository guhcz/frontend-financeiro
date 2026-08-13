export interface CreditCard {
  id: number;
  name: string;
  closingDay: number;
  dueDay: number;
  active: boolean;
}

export interface CreditCardRequest {
  name: string;
  closingDay: number;
  dueDay: number;
}
