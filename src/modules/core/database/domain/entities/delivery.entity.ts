import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Transaction } from './transaction.entity';
import { DeliveryStatus } from '../enums';

@Entity({ name: 'deliveries' })
@Index('IDX_deliveries_status', ['status'])
@Index('IDX_deliveries_customer', ['customer'])
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @ManyToOne(() => Customer, (customer) => customer.deliveries, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToOne(() => Transaction, (transaction) => transaction.delivery, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @CreateDateColumn({
    name: 'create_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createAt: Date;

  @UpdateDateColumn({
    name: 'update_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updateAt: Date;
}
