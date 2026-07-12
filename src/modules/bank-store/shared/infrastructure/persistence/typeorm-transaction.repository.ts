import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import { TransactionStatus } from '../../../../core/database/domain/enums';
import {
  CreatePendingTransactionInput,
  TransactionRepositoryPort,
} from '../../domain/ports/transaction.repository.port';

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepositoryPort {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  findAll(): Promise<Transaction[]> {
    return this.repository.find({
      order: { createAt: 'DESC' },
      relations: {
        customer: true,
        delivery: true,
        transactionProducts: {
          product: true,
        },
      },
    });
  }

  findById(id: number): Promise<Transaction | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        customer: true,
        delivery: true,
        transactionProducts: {
          product: true,
        },
      },
    });
  }

  findByReference(reference: string): Promise<Transaction | null> {
    return this.repository.findOneBy({ reference });
  }

  findByReferenceWithCustomer(reference: string): Promise<Transaction | null> {
    return this.repository.findOne({
      where: { reference },
      relations: {
        customer: true,
      },
    });
  }

  createPending(input: CreatePendingTransactionInput): Promise<Transaction> {
    const transaction = this.repository.create({
      reference: input.reference,
      totalAmount: input.totalAmount,
      baseFee: input.baseFee,
      deliveryFee: input.deliveryFee,
      status: TransactionStatus.PENDING,
      customer: { id: input.customerId } as Transaction['customer'],
    }) as Transaction;

    return this.repository.save(transaction) as Promise<Transaction>;
  }

  async updateStatus(
    id: number,
    status: TransactionStatus,
    bankTransactionId?: string | null,
  ): Promise<void> {
    await this.repository.update(
      { id },
      {
        status,
        bankTransactionId: bankTransactionId ?? undefined,
      },
    );
  }
}
