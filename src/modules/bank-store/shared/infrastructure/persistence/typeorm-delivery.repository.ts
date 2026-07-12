import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery } from '../../../../core/database/domain/entities/delivery.entity';
import {
  CreateDeliveryInput,
  DeliveryRepositoryPort,
} from '../../domain/ports/delivery.repository.port';

@Injectable()
export class TypeOrmDeliveryRepository implements DeliveryRepositoryPort {
  constructor(
    @InjectRepository(Delivery)
    private readonly repository: Repository<Delivery>,
  ) {}

  findAll(): Promise<Delivery[]> {
    return this.repository.find({
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

  findById(id: number): Promise<Delivery | null> {
    return this.repository.findOne({
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

  findByTransactionId(transactionId: number): Promise<Delivery | null> {
    return this.repository.findOne({
      where: {
        transaction: { id: transactionId },
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
  }

  createDelivery(input: CreateDeliveryInput): Promise<Delivery> {
    const delivery = this.repository.create({
      address: input.address,
      status: input.status as Delivery['status'],
      customer: { id: input.customerId } as Delivery['customer'],
      transaction: { id: input.transactionId } as Delivery['transaction'],
    });

    return this.repository.save(delivery);
  }
}
