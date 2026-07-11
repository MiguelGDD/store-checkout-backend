import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../../../../core/database/domain/entities/delivery.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import {
  DeliveryStatus,
  TransactionStatus,
} from '../../../../core/database/domain/enums';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepository: Repository<Delivery>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async findAll(): Promise<Delivery[]> {
    return this.deliveryRepository.find({
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
  }

  async findOne(id: number): Promise<Delivery | null> {
    return this.deliveryRepository.findOne({
      where: { id },
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
  }

  async assignToTransaction(transactionId: number): Promise<Delivery> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: {
        customer: true,
        delivery: true,
        transactionProducts: {
          product: true,
        },
      },
    });

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

    const delivery = await this.deliveryRepository.save(
      this.deliveryRepository.create({
        address: transaction.customer.address,
        status: DeliveryStatus.ASSIGNED,
        customer: transaction.customer,
        transaction,
      }),
    );

    const savedDelivery = await this.findOne(delivery.id);

    if (!savedDelivery) {
      throw new NotFoundException(`Delivery with ID ${delivery.id} not found`);
    }

    return savedDelivery;
  }
}
