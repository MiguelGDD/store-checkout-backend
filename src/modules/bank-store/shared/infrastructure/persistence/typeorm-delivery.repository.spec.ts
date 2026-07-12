import { Repository } from 'typeorm';
import { Customer } from '../../../../core/database/domain/entities/customer.entity';
import { Delivery } from '../../../../core/database/domain/entities/delivery.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import { DeliveryStatus } from '../../../../core/database/domain/enums';
import { TypeOrmDeliveryRepository } from './typeorm-delivery.repository';

describe('TypeOrmDeliveryRepository', () => {
  let repository: jest.Mocked<
    Pick<Repository<Delivery>, 'find' | 'findOne' | 'create' | 'save'>
  >;
  let adapter: TypeOrmDeliveryRepository;

  const customer = { id: 1, address: 'Street 1' } as Customer;
  const transaction = {
    id: 10,
    customer,
  } as Transaction;

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<Repository<Delivery>, 'find' | 'findOne' | 'create' | 'save'>
    >;

    adapter = new TypeOrmDeliveryRepository(
      repository as unknown as Repository<Delivery>,
    );
  });

  it('should find all deliveries ordered by creation date with relations', async () => {
    const deliveries = [{ id: 1 }] as Delivery[];
    repository.find.mockResolvedValue(deliveries);

    await expect(adapter.findAll()).resolves.toEqual(deliveries);

    expect(repository.find).toHaveBeenCalledWith({
      order: { createAt: 'DESC' },
      relations: {
        customer: true,
        transaction: {
          customer: true,
          transactionProducts: {
            product: true,
          },
        },
      },
    });
  });

  it('should find a delivery by id with relations', async () => {
    const delivery = { id: 1 } as Delivery;
    repository.findOne.mockResolvedValue(delivery);

    await expect(adapter.findById(1)).resolves.toEqual(delivery);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: {
        customer: true,
        transaction: {
          customer: true,
          transactionProducts: {
            product: true,
          },
        },
      },
    });
  });

  it('should find a delivery by transaction id with relations', async () => {
    const delivery = { id: 1 } as Delivery;
    repository.findOne.mockResolvedValue(delivery);

    await expect(adapter.findByTransactionId(10)).resolves.toEqual(delivery);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: {
        transaction: { id: 10 },
      },
      relations: {
        customer: true,
        transaction: {
          customer: true,
          transactionProducts: {
            product: true,
          },
        },
      },
    });
  });

  it('should create a delivery from the provided input', async () => {
    const delivery = {
      id: 1,
      address: customer.address,
      customer,
      transaction,
      status: DeliveryStatus.ASSIGNED,
    } as Delivery;
    repository.create.mockReturnValue(delivery);
    repository.save.mockResolvedValue(delivery);

    await expect(
      adapter.createDelivery({
        address: customer.address,
        status: DeliveryStatus.ASSIGNED,
        customerId: customer.id,
        transactionId: transaction.id,
      }),
    ).resolves.toEqual(delivery);

    expect(repository.create).toHaveBeenCalledWith({
      address: customer.address,
      status: DeliveryStatus.ASSIGNED,
      customer: { id: customer.id },
      transaction: { id: transaction.id },
    });
    expect(repository.save).toHaveBeenCalledWith(delivery);
  });
});
