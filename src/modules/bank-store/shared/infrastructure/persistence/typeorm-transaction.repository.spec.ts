import { Repository, UpdateResult } from 'typeorm';
import { Customer } from '../../../../core/database/domain/entities/customer.entity';
import { Delivery } from '../../../../core/database/domain/entities/delivery.entity';
import { TransactionProduct } from '../../../../core/database/domain/entities/transaction-product.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import { TransactionStatus } from '../../../../core/database/domain/enums';
import { TypeOrmTransactionRepository } from './typeorm-transaction.repository';

describe('TypeOrmTransactionRepository', () => {
  let repository: jest.Mocked<
    Pick<
      Repository<Transaction>,
      'find' | 'findOne' | 'findOneBy' | 'create' | 'save' | 'update'
    >
  >;
  let adapter: TypeOrmTransactionRepository;

  const customer = { id: 1 } as Customer;
  const delivery = { id: 10 } as Delivery;
  const transactionProducts = [{ id: 100 } as TransactionProduct];

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<
        Repository<Transaction>,
        'find' | 'findOne' | 'findOneBy' | 'create' | 'save' | 'update'
      >
    >;

    adapter = new TypeOrmTransactionRepository(
      repository as unknown as Repository<Transaction>,
    );
  });

  it('should find all transactions ordered by creation date with relations', async () => {
    const transactions = [{ id: 1 } as Transaction];
    repository.find.mockResolvedValue(transactions);

    await expect(adapter.findAll()).resolves.toEqual(transactions);

    expect(repository.find).toHaveBeenCalledWith({
      order: { createAt: 'DESC' },
      relations: {
        customer: true,
        delivery: true,
        transactionProducts: {
          product: true,
        },
      },
    });
  });

  it('should find a transaction by id with relations', async () => {
    const transaction = { id: 1 } as Transaction;
    repository.findOne.mockResolvedValue(transaction);

    await expect(adapter.findById(1)).resolves.toEqual(transaction);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: {
        customer: true,
        delivery: true,
        transactionProducts: {
          product: true,
        },
      },
    });
  });

  it('should find a transaction by reference', async () => {
    const transaction = { id: 1 } as Transaction;
    repository.findOneBy.mockResolvedValue(transaction);

    await expect(adapter.findByReference('reference-1')).resolves.toEqual(
      transaction,
    );

    expect(repository.findOneBy).toHaveBeenCalledWith({
      reference: 'reference-1',
    });
  });

  it('should find a transaction by reference with customer relation', async () => {
    const transaction = { id: 1 } as Transaction;
    repository.findOne.mockResolvedValue(transaction);

    await expect(
      adapter.findByReferenceWithCustomer('reference-1'),
    ).resolves.toEqual(transaction);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { reference: 'reference-1' },
      relations: {
        customer: true,
      },
    });
  });

  it('should create a pending transaction', async () => {
    const transaction = {
      id: 1,
      reference: 'reference-1',
      status: TransactionStatus.PENDING,
      customer,
      delivery,
      transactionProducts,
    } as Transaction;
    repository.create.mockReturnValue(transaction);
    repository.save.mockResolvedValue(transaction);

    await expect(
      adapter.createPending({
        reference: 'reference-1',
        totalAmount: 1500,
        baseFee: 1400,
        deliveryFee: 100,
        customerId: customer.id,
      }),
    ).resolves.toEqual(transaction);

    expect(repository.create).toHaveBeenCalledWith({
      reference: 'reference-1',
      totalAmount: 1500,
      baseFee: 1400,
      deliveryFee: 100,
      status: TransactionStatus.PENDING,
      customer: { id: customer.id },
    });
    expect(repository.save).toHaveBeenCalledWith(transaction);
  });

  it('should update the status with a bank transaction id', async () => {
    repository.update.mockResolvedValue({
      affected: 1,
      raw: [],
      generatedMaps: [],
    } as UpdateResult);

    await expect(
      adapter.updateStatus(1, TransactionStatus.APPROVED, 'bank-1'),
    ).resolves.toBeUndefined();

    expect(repository.update).toHaveBeenCalledWith(
      { id: 1 },
      {
        status: TransactionStatus.APPROVED,
        bankTransactionId: 'bank-1',
      },
    );
  });

  it('should update the status without a bank transaction id', async () => {
    repository.update.mockResolvedValue({
      affected: 1,
      raw: [],
      generatedMaps: [],
    } as UpdateResult);

    await expect(
      adapter.updateStatus(1, TransactionStatus.ERROR),
    ).resolves.toBeUndefined();

    expect(repository.update).toHaveBeenCalledWith(
      { id: 1 },
      {
        status: TransactionStatus.ERROR,
        bankTransactionId: undefined,
      },
    );
  });
});
