import { Product } from '../../core/database/domain/entities/product.entity';

export interface TransactionItemInput {
  productId: number;
  quantity: number;
}

export interface CardPaymentInput {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  cardHolder: string;
}

export interface CreateTransactionInput {
  customerId: number;
  items: TransactionItemInput[];
  payment: CardPaymentInput;
  deliveryFee?: number;
}

export interface PurchasedProductInput {
  product: Product;
  quantity: number;
}

export interface AcceptanceTokensInput {
  acceptanceToken: string;
  personalAuthToken: string;
}

export interface CreatePaymentTransactionInput {
  acceptanceToken: string;
  acceptPersonalAuthToken: string;
  amountInCents: number;
  currency: 'COP';
  customerEmail: string;
  paymentToken: string;
  reference: string;
}

export type ProviderTransactionStatus =
  'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';

export interface ProviderTransaction {
  id: string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  customer_email?: string;
  payment_method_type?: string;
  status: ProviderTransactionStatus;
  status_message?: string | null;
}
