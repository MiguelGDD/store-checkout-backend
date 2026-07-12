import { Module } from '@nestjs/common';
import { BankStorePersistenceModule } from '../shared/infrastructure/persistence/bank-store-persistence.module';
import { ProductsController } from './infrastructure/controllers/products.controller';
import { ProductsService } from './infrastructure/services/products.service';

@Module({
  imports: [BankStorePersistenceModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
