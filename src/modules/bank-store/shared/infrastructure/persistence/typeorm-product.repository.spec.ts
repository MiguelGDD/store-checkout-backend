import { Repository, UpdateResult } from 'typeorm';
import { Product } from '../../../../core/database/domain/entities/product.entity';
import { TypeOrmProductRepository } from './typeorm-product.repository';

describe('TypeOrmProductRepository', () => {
  let repository: jest.Mocked<
    Pick<Repository<Product>, 'find' | 'findOneBy' | 'update'>
  >;
  let adapter: TypeOrmProductRepository;

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<Repository<Product>, 'find' | 'findOneBy' | 'update'>
    >;

    adapter = new TypeOrmProductRepository(
      repository as unknown as Repository<Product>,
    );
  });

  it('should find all products ordered by name', async () => {
    const products = [{ id: 1, name: 'A' }] as Product[];
    repository.find.mockResolvedValue(products);

    await expect(adapter.findAll()).resolves.toEqual(products);

    expect(repository.find).toHaveBeenCalledWith({
      order: { name: 'ASC' },
    });
  });

  it('should find a product by id', async () => {
    const product = { id: 1, name: 'A' } as Product;
    repository.findOneBy.mockResolvedValue(product);

    await expect(adapter.findById(1)).resolves.toEqual(product);

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('should find products by ids', async () => {
    const products = [{ id: 1, name: 'A' }] as Product[];
    repository.find.mockResolvedValue(products);

    await expect(adapter.findByIds([1, 2])).resolves.toEqual(products);

    expect(repository.find).toHaveBeenCalledTimes(1);
  });

  it('should update the stock of a product', async () => {
    repository.update.mockResolvedValue({
      affected: 1,
      raw: [],
      generatedMaps: [],
    } as UpdateResult);

    await expect(adapter.updateStock(1, 7)).resolves.toBeUndefined();

    expect(repository.update).toHaveBeenCalledWith({ id: 1 }, { stock: 7 });
  });
});
