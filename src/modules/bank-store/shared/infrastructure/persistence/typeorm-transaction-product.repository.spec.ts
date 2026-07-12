import { Repository } from 'typeorm';
import { TransactionProduct } from '../../../../core/database/domain/entities/transaction-product.entity';
import { TypeOrmTransactionProductRepository } from './typeorm-transaction-product.repository';

describe('TypeOrmTransactionProductRepository', () => {
  let repository: jest.Mocked<
    Pick<Repository<TransactionProduct>, 'save' | 'find'>
  >;
  let adapter: TypeOrmTransactionProductRepository;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<Repository<TransactionProduct>, 'save' | 'find'>
    >;

    adapter = new TypeOrmTransactionProductRepository(
      repository as unknown as Repository<TransactionProduct>,
    );
  });

  it('should save many transaction products', async () => {
    const products = [{ id: 1 }, { id: 2 }] as TransactionProduct[];
    repository.save.mockResolvedValue(products as never);

    await expect(adapter.saveMany(products)).resolves.toEqual(products);

    expect(repository.save).toHaveBeenCalledWith(products);
  });

  it('should find transaction products by transaction id', async () => {
    const products = [{ id: 1 }] as TransactionProduct[];
    repository.find.mockResolvedValue(products);

    await expect(adapter.findByTransactionId(10)).resolves.toEqual(products);

    expect(repository.find).toHaveBeenCalledWith({
      where: { transaction: { id: 10 } },
      relations: ['product'],
    });
  });
});
