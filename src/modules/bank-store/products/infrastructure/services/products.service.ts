import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../../core/database/domain/entities/product.entity';
import { TransactionProduct } from '../../../../core/database/domain/entities/transaction-product.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(TransactionProduct)
    private readonly transactionProductRepository: Repository<TransactionProduct>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Product | null> {
    return this.productRepository.findOneBy({ id });
  }

  async discountPurchasedProducts(transaction: Transaction): Promise<void> {
    await this.productRepository.manager.transaction(async (manager) => {
      const transactionProductRepository =
        manager.getRepository(TransactionProduct);
      const productRepository = manager.getRepository(Product);

      const transactionProducts = await transactionProductRepository.find({
        where: { transaction: { id: transaction.id } },
        relations: ['product'],
      });

      for (const item of transactionProducts) {
        const product = await productRepository.findOneBy({
          id: item.product.id,
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.product.id} not found`,
          );
        }

        if (product.stock < item.quantity) {
          throw new ConflictException(
            `Not enough stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          );
        }

        await productRepository.update(
          { id: product.id },
          { stock: product.stock - item.quantity },
        );
      }
    });
  }
}
