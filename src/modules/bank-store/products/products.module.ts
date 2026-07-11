import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../core/database/domain/entities/product.entity';
import { TransactionProduct } from '../../core/database/domain/entities/transaction-product.entity';
import { ProductsController } from './infrastructure/controllers/products.controller';
import { ProductsService } from './infrastructure/services/products.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, TransactionProduct])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
