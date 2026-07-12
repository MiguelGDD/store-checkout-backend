import { Delivery } from '../../../../core/database/domain/entities/delivery.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';

export const DELIVERY_REPOSITORY = 'DELIVERY_REPOSITORY';

export interface CreateDeliveryInput {
  address: string;
  status: string;
  customerId: number;
  transactionId: number;
}

export interface DeliveryRepositoryPort {
  findAll(): Promise<Delivery[]>;
  findById(id: number): Promise<Delivery | null>;
  findByTransactionId(transactionId: number): Promise<Delivery | null>;
  createDelivery(input: CreateDeliveryInput): Promise<Delivery>;
}
