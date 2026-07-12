import {
  Inject,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product } from '../../../../core/database/domain/entities/product.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import {
  ProductRepositoryPort,
  TransactionProductRepositoryPort,
  PRODUCT_REPOSITORY,
  TRANSACTION_PRODUCT_REPOSITORY,
} from '../../../shared/domain/ports/product.repository.port';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(TRANSACTION_PRODUCT_REPOSITORY)
    private readonly transactionProductRepository: TransactionProductRepositoryPort,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepository.findAll();
  }

  async findOne(id: number): Promise<Product | null> {
    return this.productRepository.findById(id);
  }

  async discountPurchasedProducts(transaction: Transaction): Promise<void> {
    const transactionProducts =
      await this.transactionProductRepository.findByTransactionId(transaction.id);

    for (const item of transactionProducts) {
      const product = await this.productRepository.findById(item.product.id);

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

      await this.productRepository.updateStock(
        product.id,
        product.stock - item.quantity,
      );
    }
  }
}
