import { ConflictException, NotFoundException } from '@nestjs/common';
import { Delivery } from '../../../../core/database/domain/entities/delivery.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import { DeliveryRepositoryPort } from '../../../shared/domain/ports/delivery.repository.port';
import { TransactionRepositoryPort } from '../../../shared/domain/ports/transaction.repository.port';
import {
  DeliveryStatus,
  TransactionStatus,
} from '../../../../core/database/domain/enums';
import { DeliveriesService } from './deliveries.service';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let deliveryRepository: jest.Mocked<DeliveryRepositoryPort>;
  let transactionRepository: jest.Mocked<TransactionRepositoryPort>;

  const transaction = {
    id: 10,
    status: TransactionStatus.APPROVED,
    customer: {
      id: 1,
      address: 'Calle 123 #45-67, Bogota',
    },
    delivery: null,
  } as unknown as Transaction;

  beforeEach(() => {
    deliveryRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByTransactionId: jest.fn(),
      createDelivery: jest.fn(),
    };

    transactionRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByReference: jest.fn(),
      findByReferenceWithCustomer: jest.fn(),
      createPending: jest.fn(),
      updateStatus: jest.fn(),
    };

    service = new DeliveriesService(deliveryRepository, transactionRepository);
  });

  it('should return all deliveries ordered by creation date', async () => {
    const deliveries = [{ id: 1 }] as Delivery[];
    deliveryRepository.findAll.mockResolvedValue(deliveries);

    await expect(service.findAll()).resolves.toEqual(deliveries);
    expect(deliveryRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return one delivery by id', async () => {
    const delivery = { id: 1 } as Delivery;
    deliveryRepository.findById.mockResolvedValue(delivery);

    await expect(service.findOne(1)).resolves.toEqual(delivery);
    expect(deliveryRepository.findById).toHaveBeenCalledWith(1);
  });

  it('should assign a delivery to an approved transaction', async () => {
    transactionRepository.findById.mockResolvedValue(transaction);
    deliveryRepository.createDelivery.mockResolvedValue({
      id: 15,
      status: DeliveryStatus.ASSIGNED,
      address: transaction.customer.address,
      customer: transaction.customer,
      transaction,
      createAt: new Date(),
      updateAt: new Date(),
    } as Delivery);
    deliveryRepository.findById.mockResolvedValue({
      id: 15,
      address: transaction.customer.address,
      status: DeliveryStatus.ASSIGNED,
      customer: transaction.customer,
      transaction,
      createAt: new Date(),
      updateAt: new Date(),
    } as Delivery);

    await expect(service.assignToTransaction(10)).resolves.toEqual(
      expect.objectContaining({
        id: 15,
        status: DeliveryStatus.ASSIGNED,
      }),
    );

    expect(deliveryRepository.createDelivery).toHaveBeenCalledWith({
      address: 'Calle 123 #45-67, Bogota',
      status: DeliveryStatus.ASSIGNED,
      customerId: 1,
      transactionId: 10,
    });
  });

  it('should throw when the saved delivery cannot be reloaded', async () => {
    transactionRepository.findById.mockResolvedValue(transaction);
    deliveryRepository.createDelivery.mockResolvedValue({
      id: 15,
      status: DeliveryStatus.ASSIGNED,
    } as Delivery);
    deliveryRepository.findById.mockResolvedValueOnce(null);

    await expect(service.assignToTransaction(10)).rejects.toThrow(
      NotFoundException,
    );

    expect(deliveryRepository.createDelivery).toHaveBeenCalledWith({
      address: 'Calle 123 #45-67, Bogota',
      status: DeliveryStatus.ASSIGNED,
      customerId: 1,
      transactionId: 10,
    });
  });

  it('should return the existing delivery when the transaction was already assigned', async () => {
    transactionRepository.findById.mockResolvedValue({
      ...transaction,
      delivery: {
        id: 15,
        status: DeliveryStatus.ASSIGNED,
        address: transaction.customer.address,
        customer: transaction.customer,
        transaction,
        createAt: new Date(),
        updateAt: new Date(),
      } as Delivery,
    } as Transaction);

    await expect(service.assignToTransaction(10)).resolves.toEqual(
      expect.objectContaining({
        id: 15,
        status: DeliveryStatus.ASSIGNED,
      }),
    );

    expect(deliveryRepository.createDelivery).not.toHaveBeenCalled();
  });

  it('should throw when the transaction is not approved', async () => {
    transactionRepository.findById.mockResolvedValue({
      ...transaction,
      status: TransactionStatus.PENDING,
      delivery: undefined as unknown as Delivery,
    } as Transaction);

    await expect(service.assignToTransaction(10)).rejects.toThrow(
      ConflictException,
    );

    expect(deliveryRepository.createDelivery).not.toHaveBeenCalled();
  });

  it('should throw when the transaction does not exist', async () => {
    transactionRepository.findById.mockResolvedValue(null);

    await expect(service.assignToTransaction(10)).rejects.toThrow(
      NotFoundException,
    );
  });
});
