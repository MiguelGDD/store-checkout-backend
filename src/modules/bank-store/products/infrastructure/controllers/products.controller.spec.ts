import { NotFoundException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from '../services/products.service';
import { Product } from '../../../../core/database/domain/entities/product.entity';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: jest.Mocked<
    Pick<ProductsService, 'findAll' | 'findOne'>
  >;

  beforeEach(() => {
    productsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    controller = new ProductsController(
      productsService as unknown as ProductsService,
    );
  });

  it('should return all products', async () => {
    const products = [{ id: 1, name: 'Phone' } as Product];
    productsService.findAll.mockResolvedValue(products);

    await expect(controller.findAll()).resolves.toEqual(products);
    expect(productsService.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return one product', async () => {
    const product = { id: 1, name: 'Phone' } as Product;
    productsService.findOne.mockResolvedValue(product);

    await expect(controller.findOne(1)).resolves.toEqual(product);
    expect(productsService.findOne).toHaveBeenCalledWith(1);
  });

  it('should throw when product is not found', async () => {
    productsService.findOne.mockResolvedValue(null);

    await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
  });
});
