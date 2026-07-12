import { Repository } from 'typeorm';
import { Customer } from '../../../../core/database/domain/entities/customer.entity';
import { TypeOrmCustomerRepository } from './typeorm-customer.repository';

describe('TypeOrmCustomerRepository', () => {
  let repository: jest.Mocked<Pick<Repository<Customer>, 'findOneBy'>>;
  let adapter: TypeOrmCustomerRepository;

  beforeEach(() => {
    repository = {
      findOneBy: jest.fn(),
    } as unknown as jest.Mocked<Pick<Repository<Customer>, 'findOneBy'>>;

    adapter = new TypeOrmCustomerRepository(
      repository as unknown as Repository<Customer>,
    );
  });

  it('should find a customer by id', async () => {
    const customer = { id: 1, email: 'test@example.com' } as Customer;
    repository.findOneBy.mockResolvedValue(customer);

    await expect(adapter.findById(1)).resolves.toEqual(customer);

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });
});
