import {
  AcceptanceTokensInput,
  CardPaymentInput,
  CreatePaymentTransactionInput,
  ProviderTransaction,
} from '../../../transactions/transactions.types';

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

export interface PaymentGatewayPort {
  getAcceptanceTokens(): Promise<AcceptanceTokensInput>;
  tokenizeCard(card: CardPaymentInput): Promise<string>;
  createTransaction(
    input: CreatePaymentTransactionInput,
  ): Promise<ProviderTransaction>;
  getTransaction(transactionId: string): Promise<ProviderTransaction>;
  waitForFinalTransaction(
    transactionId: string,
    maxAttempts?: number,
    pollDelayMs?: number,
  ): Promise<ProviderTransaction>;
}
