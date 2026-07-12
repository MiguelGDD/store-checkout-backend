import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../../../../core/database/domain/entities/customer.entity';
import { Delivery } from '../../../../core/database/domain/entities/delivery.entity';
import { Product } from '../../../../core/database/domain/entities/product.entity';
import { TransactionProduct } from '../../../../core/database/domain/entities/transaction-product.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import { CUSTOMER_REPOSITORY } from '../../domain/ports/customer.repository.port';
import { DELIVERY_REPOSITORY } from '../../domain/ports/delivery.repository.port';
import {
  PRODUCT_REPOSITORY,
  TRANSACTION_PRODUCT_REPOSITORY,
} from '../../domain/ports/product.repository.port';
import { TRANSACTION_REPOSITORY } from '../../domain/ports/transaction.repository.port';
import { TypeOrmCustomerRepository } from './typeorm-customer.repository';
import { TypeOrmDeliveryRepository } from './typeorm-delivery.repository';
import { TypeOrmProductRepository } from './typeorm-product.repository';
import { TypeOrmTransactionProductRepository } from './typeorm-transaction-product.repository';
import { TypeOrmTransactionRepository } from './typeorm-transaction.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Delivery,
      Product,
      TransactionProduct,
      Transaction,
    ]),
  ],
  providers: [
    TypeOrmCustomerRepository,
    TypeOrmDeliveryRepository,
    TypeOrmProductRepository,
    TypeOrmTransactionProductRepository,
    TypeOrmTransactionRepository,
    {
      provide: CUSTOMER_REPOSITORY,
      useExisting: TypeOrmCustomerRepository,
    },
    {
      provide: DELIVERY_REPOSITORY,
      useExisting: TypeOrmDeliveryRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useExisting: TypeOrmProductRepository,
    },
    {
      provide: TRANSACTION_PRODUCT_REPOSITORY,
      useExisting: TypeOrmTransactionProductRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useExisting: TypeOrmTransactionRepository,
    },
  ],
  exports: [
    CUSTOMER_REPOSITORY,
    DELIVERY_REPOSITORY,
    PRODUCT_REPOSITORY,
    TRANSACTION_PRODUCT_REPOSITORY,
    TRANSACTION_REPOSITORY,
  ],
})
export class BankStorePersistenceModule {}
