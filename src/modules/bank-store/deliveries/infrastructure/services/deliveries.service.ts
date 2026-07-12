import {
  Inject,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Delivery } from '../../../../core/database/domain/entities/delivery.entity';
import {
  DeliveryStatus,
  TransactionStatus,
} from '../../../../core/database/domain/enums';
import {
  DeliveryRepositoryPort,
  DELIVERY_REPOSITORY,
} from '../../../shared/domain/ports/delivery.repository.port';
import {
  TransactionRepositoryPort,
  TRANSACTION_REPOSITORY,
} from '../../../shared/domain/ports/transaction.repository.port';

@Injectable()
export class DeliveriesService {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepository: DeliveryRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
  ) {}

  async findAll(): Promise<Delivery[]> {
    return this.deliveryRepository.findAll();
  }

  async findOne(id: number): Promise<Delivery | null> {
    return this.deliveryRepository.findById(id);
  }

  async assignToTransaction(transactionId: number): Promise<Delivery> {
    const transaction =
      await this.transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    if (transaction.delivery) {
      return transaction.delivery;
    }

    if (transaction.status !== TransactionStatus.APPROVED) {
      throw new ConflictException(
        `Transaction with ID ${transactionId} must be approved before delivery assignment`,
      );
    }

    const delivery = await this.deliveryRepository.createDelivery({
      address: transaction.customer.address,
      status: DeliveryStatus.ASSIGNED,
      customerId: transaction.customer.id,
      transactionId: transaction.id,
    });

    const savedDelivery = await this.findOne(delivery.id);

    if (!savedDelivery) {
      throw new NotFoundException(`Delivery with ID ${delivery.id} not found`);
    }

    return savedDelivery;
  }
}
