import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Delivery } from '../../../../core/database/domain/entities/delivery.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import {
  DeliveryStatus,
  TransactionStatus,
} from '../../../../core/database/domain/enums';
import { DeliveriesService } from './deliveries.service';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let deliveryRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let transactionRepository: {
    findOne: jest.Mock;
  };

  const transaction = {
    id: 10,
    status: TransactionStatus.APPROVED,
    customer: {
      id: 1,
      address: 'Calle 123 #45-67, Bogota',
    },
    delivery: null,
    transactionProducts: [
      {
        id: 1,
        quantity: 1,
        product: {
          id: 99,
          name: 'Smartphone',
        },
      },
    ],
  } as unknown as Transaction;

  beforeEach(() => {
    deliveryRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((payload: unknown) => payload),
    };

    transactionRepository = {
      findOne: jest.fn(),
    };

    service = new DeliveriesService(
      deliveryRepository as unknown as Repository<Delivery>,
      transactionRepository as unknown as Repository<Transaction>,
    );
  });

  it('should return all deliveries ordered by creation date', async () => {
    const deliveries = [{ id: 1 }] as Delivery[];
    deliveryRepository.find.mockResolvedValue(deliveries);

    await expect(service.findAll()).resolves.toEqual(deliveries);
    expect(deliveryRepository.find).toHaveBeenCalledWith({
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

  it('should return one delivery by id', async () => {
    const delivery = { id: 1 } as Delivery;
    deliveryRepository.findOne.mockResolvedValue(delivery);

    await expect(service.findOne(1)).resolves.toEqual(delivery);
    expect(deliveryRepository.findOne).toHaveBeenCalledWith({
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

  it('should assign a delivery to an approved transaction', async () => {
    transactionRepository.findOne.mockResolvedValue(transaction);
    deliveryRepository.save.mockResolvedValue({
      id: 15,
    });
    deliveryRepository.findOne.mockResolvedValue({
      id: 15,
      address: transaction.customer.address,
      status: DeliveryStatus.ASSIGNED,
    });

    await expect(service.assignToTransaction(10)).resolves.toEqual(
      expect.objectContaining({
        id: 15,
        status: DeliveryStatus.ASSIGNED,
      }),
    );

    expect(deliveryRepository.create).toHaveBeenCalledWith({
      address: 'Calle 123 #45-67, Bogota',
      status: DeliveryStatus.ASSIGNED,
      customer: transaction.customer,
      transaction,
    });
  });

  it('should throw when the saved delivery cannot be reloaded', async () => {
    transactionRepository.findOne.mockResolvedValue(transaction);
    deliveryRepository.save.mockResolvedValue({
      id: 15,
    });
    deliveryRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.assignToTransaction(10)).rejects.toThrow(
      NotFoundException,
    );

    expect(deliveryRepository.create).toHaveBeenCalledWith({
      address: 'Calle 123 #45-67, Bogota',
      status: DeliveryStatus.ASSIGNED,
      customer: transaction.customer,
      transaction,
    });
  });
  it('should return the existing delivery when the transaction was already assigned', async () => {
    transactionRepository.findOne.mockResolvedValue({
      ...transaction,
      delivery: {
        id: 15,
        status: DeliveryStatus.ASSIGNED,
      },
    });

    await expect(service.assignToTransaction(10)).resolves.toEqual({
      id: 15,
      status: DeliveryStatus.ASSIGNED,
    });

    expect(deliveryRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when the transaction is not approved', async () => {
    transactionRepository.findOne.mockResolvedValue({
      ...transaction,
      status: TransactionStatus.PENDING,
      delivery: null,
    });

    await expect(service.assignToTransaction(10)).rejects.toThrow(
      ConflictException,
    );

    expect(deliveryRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when the transaction does not exist', async () => {
    transactionRepository.findOne.mockResolvedValue(null);

    await expect(service.assignToTransaction(10)).rejects.toThrow(
      NotFoundException,
    );
  });
});
