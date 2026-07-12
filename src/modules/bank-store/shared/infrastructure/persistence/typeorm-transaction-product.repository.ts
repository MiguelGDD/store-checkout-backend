import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionProduct } from '../../../../core/database/domain/entities/transaction-product.entity';
import { TransactionProductRepositoryPort } from '../../domain/ports/product.repository.port';

@Injectable()
export class TypeOrmTransactionProductRepository implements TransactionProductRepositoryPort {
  constructor(
    @InjectRepository(TransactionProduct)
    private readonly repository: Repository<TransactionProduct>,
  ) {}

  saveMany(products: TransactionProduct[]): Promise<TransactionProduct[]> {
    return this.repository.save(products);
  }

  findByTransactionId(transactionId: number): Promise<TransactionProduct[]> {
    return this.repository.find({
      where: { transaction: { id: transactionId } },
      relations: ['product'],
    });
  }
}
