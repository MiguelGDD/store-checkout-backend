import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { In, Repository } from 'typeorm';
import { Customer } from '../../../../core/database/domain/entities/customer.entity';
import { Product } from '../../../../core/database/domain/entities/product.entity';
import { TransactionProduct } from '../../../../core/database/domain/entities/transaction-product.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import { TransactionStatus } from '../../../../core/database/domain/enums';
import { DeliveriesService } from '../../../deliveries/infrastructure/services/deliveries.service';
import { ProductsService } from '../../../products/infrastructure/services/products.service';
import {
  AcceptanceTokensInput,
  CreatePaymentTransactionInput,
  CreateTransactionInput,
  ProviderTransactionStatus,
  PurchasedProductInput,
} from '../../transactions.types';
import { PaymentGatewayService } from './payment-gateway.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly productsService: ProductsService,
    private readonly deliveriesService: DeliveriesService,
  ) {}

  async checkout(dto: CreateTransactionInput): Promise<Transaction> {
    const customer = await this.findCustomer(dto.customerId);
    const selectedProducts = await this.loadPurchasedProducts(dto.items);
    const deliveryFee = dto.deliveryFee ?? 0;
    const baseFee = this.calculateBaseFee(selectedProducts);
    const totalAmount = baseFee + deliveryFee;
    const reference = randomUUID();

    this.ensureStockAvailability(selectedProducts);

    const pendingTransaction =
      await this.transactionRepository.manager.transaction(async (manager) => {
        const transaction = manager.create(Transaction, {
          reference,
          totalAmount,
          baseFee,
          deliveryFee,
          status: TransactionStatus.PENDING,
          customer,
        });

        const savedTransaction = await manager.save(Transaction, transaction);

        const transactionProducts = selectedProducts.map((item) =>
          manager.create(TransactionProduct, {
            transaction: savedTransaction,
            product: item.product,
            quantity: item.quantity,
            unitAmount: item.product.price,
          }),
        );

        await manager.save(TransactionProduct, transactionProducts);

        return savedTransaction;
      });

    let finalProviderTransactionId: string | null = null;
    let finalStatus = TransactionStatus.ERROR;

    try {
      const acceptanceTokens =
        await this.paymentGatewayService.getAcceptanceTokens();
      const paymentToken = await this.paymentGatewayService.tokenizeCard(
        dto.payment,
      );
      const providerTransaction =
        await this.paymentGatewayService.createTransaction(
          this.buildPaymentPayload(
            pendingTransaction.reference,
            customer.email,
            paymentToken,
            totalAmount,
            acceptanceTokens,
          ),
        );

      const finalProviderTransaction =
        providerTransaction.status === 'PENDING'
          ? await this.paymentGatewayService.waitForFinalTransaction(
              providerTransaction.id,
            )
          : providerTransaction;

      finalProviderTransactionId = finalProviderTransaction.id;
      finalStatus = this.mapProviderStatus(finalProviderTransaction.status);
    } catch (error) {
      await this.transactionRepository.update(
        { id: pendingTransaction.id },
        {
          status: TransactionStatus.ERROR,
        },
      );

      throw error;
    }

    await this.transactionRepository.update(
      { id: pendingTransaction.id },
      {
        status: finalStatus,
        bankTransactionId: finalProviderTransactionId,
      },
    );

    if (finalStatus === TransactionStatus.APPROVED) {
      await this.productsService.discountPurchasedProducts(pendingTransaction);
      await this.deliveriesService.assignToTransaction(pendingTransaction.id);
    }

    return this.findOneOrFail(pendingTransaction.id);
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionRepository.find({
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

  async findOne(id: number): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
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

  private async findOneOrFail(id: number): Promise<Transaction> {
    const transaction = await this.findOne(id);

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  private async findCustomer(customerId: number): Promise<Customer> {
    const customer = await this.customerRepository.findOneBy({
      id: customerId,
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return customer;
  }

  private async loadPurchasedProducts(
    items: CreateTransactionInput['items'],
  ): Promise<PurchasedProductInput[]> {
    const normalizedItems = this.normalizeItems(items);
    const productIds = [
      ...new Set(normalizedItems.map((item) => item.productId)),
    ];
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
    });

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((product) => product.id));
      const missingIds = productIds.filter(
        (productId) => !foundIds.has(productId),
      );

      throw new NotFoundException(
        `Products with IDs ${missingIds.join(', ')} not found`,
      );
    }

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    return normalizedItems.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      return {
        product,
        quantity: item.quantity,
      };
    });
  }

  private ensureStockAvailability(products: PurchasedProductInput[]): void {
    for (const item of products) {
      if (item.product.stock < item.quantity) {
        throw new ConflictException(
          `Not enough stock for product ${item.product.name}. Available: ${item.product.stock}, Requested: ${item.quantity}`,
        );
      }
    }
  }

  private normalizeItems(items: CreateTransactionInput['items']) {
    const quantitiesByProductId = new Map<number, number>();

    for (const item of items) {
      const quantity = quantitiesByProductId.get(item.productId) ?? 0;
      quantitiesByProductId.set(item.productId, quantity + item.quantity);
    }

    return [...quantitiesByProductId.entries()].map(
      ([productId, quantity]) => ({
        productId,
        quantity,
      }),
    );
  }

  private calculateBaseFee(products: PurchasedProductInput[]): number {
    return products.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );
  }

  private buildPaymentPayload(
    reference: string,
    customerEmail: string,
    paymentToken: string,
    totalAmount: number,
    acceptanceTokens: AcceptanceTokensInput,
  ): CreatePaymentTransactionInput {
    return {
      acceptanceToken: acceptanceTokens.acceptanceToken,
      acceptPersonalAuthToken: acceptanceTokens.personalAuthToken,
      amountInCents: totalAmount * 100,
      currency: 'COP',
      customerEmail,
      paymentToken,
      reference,
    };
  }

  private mapProviderStatus(
    status: ProviderTransactionStatus,
  ): TransactionStatus {
    switch (status) {
      case 'APPROVED':
        return TransactionStatus.APPROVED;
      case 'DECLINED':
        return TransactionStatus.DECLINED;
      case 'VOIDED':
        return TransactionStatus.VOIDED;
      case 'ERROR':
        return TransactionStatus.ERROR;
      case 'PENDING':
      default:
        return TransactionStatus.ERROR;
    }
  }
}
