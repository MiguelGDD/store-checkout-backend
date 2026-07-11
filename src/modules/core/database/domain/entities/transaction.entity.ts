import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Delivery } from './delivery.entity';
import { TransactionProduct } from './transaction-product.entity';
import { TransactionStatus } from '../enums';

@Entity({ name: 'transactions' })
@Index('IDX_transactions_status', ['status'])
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  reference: string;

  @Column({ type: 'int', name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'int', name: 'base_fee' })
  baseFee: number;

  @Column({ type: 'int', name: 'delivery_fee' })
  deliveryFee: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'bank_transaction_id',
    nullable: true,
  })
  bankTransactionId: string | null;

  @ManyToOne(() => Customer, (customer) => customer.transactions, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToMany(
    () => TransactionProduct,
    (transactionProduct) => transactionProduct.transaction,
  )
  transactionProducts: TransactionProduct[];

  @OneToOne(() => Delivery, (delivery) => delivery.transaction)
  delivery: Delivery;

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
