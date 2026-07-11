import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../../core/database/domain/entities/customer.entity';
import { Product } from '../../core/database/domain/entities/product.entity';
import { TransactionProduct } from '../../core/database/domain/entities/transaction-product.entity';
import { Transaction } from '../../core/database/domain/entities/transaction.entity';
import { ProductsModule } from '../products/products.module';
import { TransactionsController } from './infrastructure/controllers/transactions.controller';
import { PaymentGatewayService } from './infrastructure/services/payment-gateway.service';
import { TransactionsService } from './infrastructure/services/transactions.service';

@Module({
  imports: [
    HttpModule,
    ProductsModule,
    TypeOrmModule.forFeature([
      Transaction,
      TransactionProduct,
      Customer,
      Product,
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, PaymentGatewayService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
