import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from '../../../../core/database/domain/entities/product.entity';
import { TransactionProduct } from '../../../../core/database/domain/entities/transaction-product.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';

type ManagerMock = {
  getRepository: (entity: unknown) => {
    find?: jest.Mock;
    findOneBy?: jest.Mock;
    update?: jest.Mock;
  };
};

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    update: jest.Mock;
    manager: {
      transaction: jest.Mock;
    };
  };
  let transactionProductRepository: {
    find: jest.Mock;
  };

  beforeEach(() => {
    productRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };

    transactionProductRepository = {
      find: jest.fn(),
    };

    service = new ProductsService(
      productRepository as unknown as Repository<Product>,
      transactionProductRepository as unknown as Repository<TransactionProduct>,
    );
  });

  it('should return all products ordered by name', async () => {
    const products = [{ id: 1, name: 'A' }] as Product[];
    productRepository.find.mockResolvedValue(products);

    await expect(service.findAll()).resolves.toEqual(products);
    expect(productRepository.find).toHaveBeenCalledWith({
      order: { name: 'ASC' },
    });
  });

  it('should return one product by id', async () => {
    const product = { id: 1, name: 'A' } as Product;
    productRepository.findOneBy.mockResolvedValue(product);

    await expect(service.findOne(1)).resolves.toEqual(product);
    expect(productRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('should discount stock for purchased products', async () => {
    const transaction = { id: 10 } as Transaction;
    const transactionProducts = [
      {
        quantity: 2,
        product: { id: 1 },
      },
    ] as TransactionProduct[];
    const product = { id: 1, name: 'Phone', stock: 5 } as Product;
    const transactionProductRepo = {
      find: jest.fn().mockResolvedValue(transactionProducts),
    };
    const productRepo = {
      findOneBy: jest.fn().mockResolvedValue(product),
      update: jest.fn().mockResolvedValue(undefined),
    };

    productRepository.manager.transaction.mockImplementation(
      async (callback: (manager: ManagerMock) => Promise<void>) => {
        await callback({
          getRepository: (entity: unknown) =>
            entity === TransactionProduct
              ? transactionProductRepo
              : productRepo,
        });
      },
    );

    await service.discountPurchasedProducts(transaction);

    expect(productRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(productRepo.update).toHaveBeenCalledWith({ id: 1 }, { stock: 3 });
  });

  it('should throw when product has not enough stock', async () => {
    const transaction = { id: 10 } as Transaction;
    const transactionProducts = [
      {
        quantity: 8,
        product: { id: 1 },
      },
    ] as TransactionProduct[];
    const transactionProductRepo = {
      find: jest.fn().mockResolvedValue(transactionProducts),
    };
    const productRepo = {
      findOneBy: jest.fn().mockResolvedValue({
        id: 1,
        name: 'Phone',
        stock: 5,
      } as Product),
      update: jest.fn(),
    };

    productRepository.manager.transaction.mockImplementation(
      async (callback: (manager: ManagerMock) => Promise<void>) => {
        await callback({
          getRepository: (entity: unknown) =>
            entity === TransactionProduct
              ? transactionProductRepo
              : productRepo,
        });
      },
    );

    await expect(
      service.discountPurchasedProducts(transaction),
    ).rejects.toThrow(ConflictException);
    expect(productRepo.update).not.toHaveBeenCalled();
  });

  it('should throw when a product is missing', async () => {
    const transaction = { id: 10 } as Transaction;
    const transactionProducts = [
      {
        quantity: 1,
        product: { id: 99 },
      },
    ] as TransactionProduct[];
    const transactionProductRepo = {
      find: jest.fn().mockResolvedValue(transactionProducts),
    };
    const productRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    };

    productRepository.manager.transaction.mockImplementation(
      async (callback: (manager: ManagerMock) => Promise<void>) => {
        await callback({
          getRepository: (entity: unknown) =>
            entity === TransactionProduct
              ? transactionProductRepo
              : productRepo,
        });
      },
    );

    await expect(
      service.discountPurchasedProducts(transaction),
    ).rejects.toThrow(NotFoundException);
  });
});
