import { ConflictException, NotFoundException } from '@nestjs/common';
import { Product } from '../../../../core/database/domain/entities/product.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import { TransactionProduct } from '../../../../core/database/domain/entities/transaction-product.entity';
import {
  ProductRepositoryPort,
  TransactionProductRepositoryPort,
} from '../../../shared/domain/ports/product.repository.port';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: jest.Mocked<ProductRepositoryPort>;
  let transactionProductRepository: jest.Mocked<TransactionProductRepositoryPort>;

  beforeEach(() => {
    productRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      updateStock: jest.fn(),
    };

    transactionProductRepository = {
      saveMany: jest.fn(),
      findByTransactionId: jest.fn(),
    };

    service = new ProductsService(
      productRepository,
      transactionProductRepository,
    );
  });

  it('should return all products ordered by name', async () => {
    const products = [{ id: 1, name: 'A' }] as Product[];
    productRepository.findAll.mockResolvedValue(products);

    await expect(service.findAll()).resolves.toEqual(products);
    expect(productRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return one product by id', async () => {
    const product = { id: 1, name: 'A' } as Product;
    productRepository.findById.mockResolvedValue(product);

    await expect(service.findOne(1)).resolves.toEqual(product);
    expect(productRepository.findById).toHaveBeenCalledWith(1);
  });

  it('should discount stock for purchased products', async () => {
    const transaction = { id: 10 } as Transaction;
    const transactionProducts = [
      {
        quantity: 2,
        product: { id: 1 } as Product,
      },
    ] as TransactionProduct[];
    const product = { id: 1, name: 'Phone', stock: 5 } as Product;

    transactionProductRepository.findByTransactionId.mockResolvedValue(
      transactionProducts,
    );
    productRepository.findById.mockResolvedValue(product);
    productRepository.updateStock.mockResolvedValue(undefined);

    await service.discountPurchasedProducts(transaction);

    expect(
      transactionProductRepository.findByTransactionId,
    ).toHaveBeenCalledWith(10);
    expect(productRepository.findById).toHaveBeenCalledWith(1);
    expect(productRepository.updateStock).toHaveBeenCalledWith(1, 3);
  });

  it('should throw when product has not enough stock', async () => {
    const transaction = { id: 10 } as Transaction;
    transactionProductRepository.findByTransactionId.mockResolvedValue([
      {
        quantity: 8,
        product: { id: 1 } as Product,
      },
    ] as TransactionProduct[]);
    productRepository.findById.mockResolvedValue({
      id: 1,
      name: 'Phone',
      stock: 5,
    } as Product);

    await expect(
      service.discountPurchasedProducts(transaction),
    ).rejects.toThrow(ConflictException);
    expect(productRepository.updateStock).not.toHaveBeenCalled();
  });

  it('should throw when a product is missing', async () => {
    const transaction = { id: 10 } as Transaction;
    transactionProductRepository.findByTransactionId.mockResolvedValue([
      {
        quantity: 1,
        product: { id: 99 } as Product,
      },
    ] as TransactionProduct[]);
    productRepository.findById.mockResolvedValue(null);

    await expect(
      service.discountPurchasedProducts(transaction),
    ).rejects.toThrow(NotFoundException);
  });
});
