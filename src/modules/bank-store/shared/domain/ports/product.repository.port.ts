import { Product } from '../../../../core/database/domain/entities/product.entity';
import { TransactionProduct } from '../../../../core/database/domain/entities/transaction-product.entity';

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';
export const TRANSACTION_PRODUCT_REPOSITORY = 'TRANSACTION_PRODUCT_REPOSITORY';

export interface ProductRepositoryPort {
  findAll(): Promise<Product[]>;
  findById(id: number): Promise<Product | null>;
  findByIds(ids: number[]): Promise<Product[]>;
  updateStock(id: number, stock: number): Promise<void>;
}

export interface TransactionProductRepositoryPort {
  saveMany(products: TransactionProduct[]): Promise<TransactionProduct[]>;
  findByTransactionId(transactionId: number): Promise<TransactionProduct[]>;
}
