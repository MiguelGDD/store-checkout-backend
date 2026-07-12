import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import { TransactionStatus } from '../../../../core/database/domain/enums';

export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY';

export interface CreatePendingTransactionInput {
  reference: string;
  totalAmount: number;
  baseFee: number;
  deliveryFee: number;
  customerId: number;
}

export interface TransactionRepositoryPort {
  findAll(): Promise<Transaction[]>;
  findById(id: number): Promise<Transaction | null>;
  findByReference(reference: string): Promise<Transaction | null>;
  findByReferenceWithCustomer(reference: string): Promise<Transaction | null>;
  createPending(input: CreatePendingTransactionInput): Promise<Transaction>;
  updateStatus(
    id: number,
    status: TransactionStatus,
    bankTransactionId?: string | null,
  ): Promise<void>;
}
