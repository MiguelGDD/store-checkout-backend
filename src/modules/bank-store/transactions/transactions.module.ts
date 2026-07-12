import { Module } from '@nestjs/common';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { ProductsModule } from '../products/products.module';
import { BankStorePersistenceModule } from '../shared/infrastructure/persistence/bank-store-persistence.module';
import { PaymentGatewayModule } from '../shared/infrastructure/http/payment-gateway.module';
import { TransactionsController } from './infrastructure/controllers/transactions.controller';
import { TransactionsService } from './infrastructure/services/transactions.service';

@Module({
  imports: [
    BankStorePersistenceModule,
    PaymentGatewayModule,
    DeliveriesModule,
    ProductsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
