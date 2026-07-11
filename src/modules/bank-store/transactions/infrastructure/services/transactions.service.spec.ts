import {
  BadGatewayException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Customer } from '../../../../core/database/domain/entities/customer.entity';
import { Product } from '../../../../core/database/domain/entities/product.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import { TransactionStatus } from '../../../../core/database/domain/enums';
import { DeliveriesService } from '../../../deliveries/infrastructure/services/deliveries.service';
import { ProductsService } from '../../../products/infrastructure/services/products.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  type ManagerMock = {
    create: jest.Mock;
    save: jest.Mock;
  };
  let transactionRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    manager: {
      transaction: jest.Mock;
    };
  };
  let customerRepository: {
    findOneBy: jest.Mock;
  };
  let productRepository: {
    find: jest.Mock;
  };
  let paymentGatewayService: {
    getAcceptanceTokens: jest.Mock;
    tokenizeCard: jest.Mock;
    createTransaction: jest.Mock;
    waitForFinalTransaction: jest.Mock;
  };
  let productsService: {
    discountPurchasedProducts: jest.Mock;
  };
  let deliveriesService: {
    assignToTransaction: jest.Mock;
  };

  const customer = {
    id: 1,
    email: 'juan.perez@example.com',
  } as Customer;

  const products = [
    {
      id: 1,
      name: 'Smartphone',
      price: 1000,
      stock: 5,
    },
    {
      id: 2,
      name: 'Headphones',
      price: 500,
      stock: 4,
    },
  ] as Product[];

  const manager: ManagerMock = {
    create: jest.fn((_entity: unknown, payload: unknown) => payload),
    save: jest.fn(async (entity: unknown, payload: unknown) => {
      if (entity === Transaction) {
        return {
          ...(payload as Record<string, unknown>),
          id: 10,
        } as Transaction;
      }

      return payload;
    }),
  };

  beforeEach(() => {
    transactionRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      manager: {
        transaction: jest.fn(
          async (callback: (manager: ManagerMock) => Promise<unknown>) =>
            callback(manager),
        ),
      },
    };

    customerRepository = {
      findOneBy: jest.fn(),
    };

    productRepository = {
      find: jest.fn(),
    };

    paymentGatewayService = {
      getAcceptanceTokens: jest.fn(),
      tokenizeCard: jest.fn(),
      createTransaction: jest.fn(),
      waitForFinalTransaction: jest.fn(),
    };

    productsService = {
      discountPurchasedProducts: jest.fn(),
    };

    deliveriesService = {
      assignToTransaction: jest.fn(),
    };

    manager.create.mockClear();
    manager.save.mockClear();

    service = new TransactionsService(
      transactionRepository as unknown as Repository<Transaction>,
      customerRepository as unknown as Repository<Customer>,
      productRepository as unknown as Repository<Product>,
      paymentGatewayService as unknown as PaymentGatewayService,
      productsService as unknown as ProductsService,
      deliveriesService as unknown as DeliveriesService,
    );
  });

  it('should return all transactions ordered by creation date', async () => {
    const transactions = [{ id: 1 }] as Transaction[];
    transactionRepository.find.mockResolvedValue(transactions);

    await expect(service.findAll()).resolves.toEqual(transactions);

    expect(transactionRepository.find).toHaveBeenCalledWith({
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

  it('should return one transaction by id', async () => {
    const transaction = { id: 1 } as Transaction;
    transactionRepository.findOne.mockResolvedValue(transaction);

    await expect(service.findOne(1)).resolves.toEqual(transaction);

    expect(transactionRepository.findOne).toHaveBeenCalledWith({
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

  it('should complete a checkout when the payment is approved', async () => {
    const finalTransaction = {
      id: 10,
      reference: 'reference-1',
      status: TransactionStatus.APPROVED,
      bankTransactionId: 'provider-transaction-id',
      totalAmount: 2600,
      baseFee: 2500,
      deliveryFee: 100,
      customer,
      transactionProducts: [],
      delivery: null,
    } as unknown as Transaction;

    customerRepository.findOneBy.mockResolvedValue(customer);
    productRepository.find.mockResolvedValue(products);
    paymentGatewayService.getAcceptanceTokens.mockResolvedValue({
      acceptanceToken: 'acceptance-token',
      personalAuthToken: 'personal-token',
    });
    paymentGatewayService.tokenizeCard.mockResolvedValue('card-token');
    paymentGatewayService.createTransaction.mockResolvedValue({
      id: 'provider-transaction-id',
      reference: 'reference-1',
      amount_in_cents: 260000,
      currency: 'COP',
      status: 'PENDING',
    });
    paymentGatewayService.waitForFinalTransaction.mockResolvedValue({
      id: 'provider-transaction-id',
      reference: 'reference-1',
      amount_in_cents: 260000,
      currency: 'COP',
      status: 'APPROVED',
    });
    transactionRepository.findOne.mockResolvedValue(finalTransaction);
    deliveriesService.assignToTransaction.mockResolvedValue({
      id: 20,
      status: 'ASSIGNED',
    });

    await expect(
      service.checkout({
        customerId: 1,
        items: [
          {
            productId: 1,
            quantity: 1,
          },
          {
            productId: 1,
            quantity: 1,
          },
          {
            productId: 2,
            quantity: 1,
          },
        ],
        deliveryFee: 100,
        payment: {
          number: '4242424242424242',
          expMonth: '06',
          expYear: '29',
          cvc: '123',
          cardHolder: 'Pedro Perez',
        },
      }),
    ).resolves.toEqual(finalTransaction);

    expect(customerRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(productRepository.find).toHaveBeenCalledWith({
      where: { id: expect.anything() },
    });
    expect(paymentGatewayService.getAcceptanceTokens).toHaveBeenCalledTimes(1);
    expect(paymentGatewayService.tokenizeCard).toHaveBeenCalledWith({
      number: '4242424242424242',
      expMonth: '06',
      expYear: '29',
      cvc: '123',
      cardHolder: 'Pedro Perez',
    });
    expect(paymentGatewayService.createTransaction).toHaveBeenCalledWith({
      acceptanceToken: 'acceptance-token',
      acceptPersonalAuthToken: 'personal-token',
      amountInCents: 260000,
      currency: 'COP',
      customerEmail: 'juan.perez@example.com',
      paymentToken: 'card-token',
      reference: expect.any(String),
    });
    expect(paymentGatewayService.waitForFinalTransaction).toHaveBeenCalledWith(
      'provider-transaction-id',
    );
    expect(transactionRepository.update).toHaveBeenCalledWith(
      { id: 10 },
      {
        status: TransactionStatus.APPROVED,
        bankTransactionId: 'provider-transaction-id',
      },
    );
    expect(productsService.discountPurchasedProducts).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10 }),
    );
    expect(deliveriesService.assignToTransaction).toHaveBeenCalledWith(10);
  });

  it('should mark the transaction as declined when the provider declines it', async () => {
    const declinedTransaction = {
      id: 10,
      reference: 'reference-2',
      status: TransactionStatus.DECLINED,
      bankTransactionId: 'provider-transaction-id-2',
      totalAmount: 1500,
      baseFee: 1500,
      deliveryFee: 0,
      customer,
      transactionProducts: [],
      delivery: null,
    } as unknown as Transaction;

    customerRepository.findOneBy.mockResolvedValue(customer);
    productRepository.find.mockResolvedValue([products[0]]);
    paymentGatewayService.getAcceptanceTokens.mockResolvedValue({
      acceptanceToken: 'acceptance-token',
      personalAuthToken: 'personal-token',
    });
    paymentGatewayService.tokenizeCard.mockResolvedValue('card-token');
    paymentGatewayService.createTransaction.mockResolvedValue({
      id: 'provider-transaction-id-2',
      reference: 'reference-2',
      amount_in_cents: 150000,
      currency: 'COP',
      status: 'DECLINED',
    });
    transactionRepository.findOne.mockResolvedValue(declinedTransaction);

    await expect(
      service.checkout({
        customerId: 1,
        items: [
          {
            productId: 1,
            quantity: 1,
          },
        ],
        payment: {
          number: '4242424242424242',
          expMonth: '06',
          expYear: '29',
          cvc: '123',
          cardHolder: 'Pedro Perez',
        },
      }),
    ).resolves.toEqual(declinedTransaction);

    expect(
      paymentGatewayService.waitForFinalTransaction,
    ).not.toHaveBeenCalled();
    expect(transactionRepository.update).toHaveBeenCalledWith(
      { id: 10 },
      {
        status: TransactionStatus.DECLINED,
        bankTransactionId: 'provider-transaction-id-2',
      },
    );
    expect(productsService.discountPurchasedProducts).not.toHaveBeenCalled();
    expect(deliveriesService.assignToTransaction).not.toHaveBeenCalled();
  });

  it('should map a voided provider transaction', async () => {
    const voidedTransaction = {
      id: 10,
      reference: 'reference-3',
      status: TransactionStatus.VOIDED,
      bankTransactionId: 'provider-transaction-id-3',
      totalAmount: 1500,
      baseFee: 1500,
      deliveryFee: 0,
      customer,
      transactionProducts: [],
      delivery: null,
    } as unknown as Transaction;

    customerRepository.findOneBy.mockResolvedValue(customer);
    productRepository.find.mockResolvedValue([products[0]]);
    paymentGatewayService.getAcceptanceTokens.mockResolvedValue({
      acceptanceToken: 'acceptance-token',
      personalAuthToken: 'personal-token',
    });
    paymentGatewayService.tokenizeCard.mockResolvedValue('card-token');
    paymentGatewayService.createTransaction.mockResolvedValue({
      id: 'provider-transaction-id-3',
      reference: 'reference-3',
      amount_in_cents: 150000,
      currency: 'COP',
      status: 'PENDING',
    });
    paymentGatewayService.waitForFinalTransaction.mockResolvedValue({
      id: 'provider-transaction-id-3',
      reference: 'reference-3',
      amount_in_cents: 150000,
      currency: 'COP',
      status: 'VOIDED',
    });
    transactionRepository.findOne.mockResolvedValue(voidedTransaction);

    await expect(
      service.checkout({
        customerId: 1,
        items: [
          {
            productId: 1,
            quantity: 1,
          },
        ],
        payment: {
          number: '4242424242424242',
          expMonth: '06',
          expYear: '29',
          cvc: '123',
          cardHolder: 'Pedro Perez',
        },
      }),
    ).resolves.toEqual(voidedTransaction);

    expect(transactionRepository.update).toHaveBeenCalledWith(
      { id: 10 },
      {
        status: TransactionStatus.VOIDED,
        bankTransactionId: 'provider-transaction-id-3',
      },
    );
    expect(productsService.discountPurchasedProducts).not.toHaveBeenCalled();
    expect(deliveriesService.assignToTransaction).not.toHaveBeenCalled();
  });

  it('should mark the transaction as error when the provider call fails', async () => {
    customerRepository.findOneBy.mockResolvedValue(customer);
    productRepository.find.mockResolvedValue([products[0]]);
    paymentGatewayService.getAcceptanceTokens.mockResolvedValue({
      acceptanceToken: 'acceptance-token',
      personalAuthToken: 'personal-token',
    });
    paymentGatewayService.tokenizeCard.mockResolvedValue('card-token');
    paymentGatewayService.createTransaction.mockRejectedValue(
      new BadGatewayException('provider error'),
    );
    transactionRepository.findOne.mockResolvedValue(null);

    await expect(
      service.checkout({
        customerId: 1,
        items: [
          {
            productId: 1,
            quantity: 1,
          },
        ],
        payment: {
          number: '4242424242424242',
          expMonth: '06',
          expYear: '29',
          cvc: '123',
          cardHolder: 'Pedro Perez',
        },
      }),
    ).rejects.toThrow(BadGatewayException);

    expect(transactionRepository.update).toHaveBeenCalledWith(
      { id: 10 },
      {
        status: TransactionStatus.ERROR,
      },
    );
    expect(productsService.discountPurchasedProducts).not.toHaveBeenCalled();
    expect(deliveriesService.assignToTransaction).not.toHaveBeenCalled();
  });

  it('should throw when customer does not exist', async () => {
    customerRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.checkout({
        customerId: 1,
        items: [
          {
            productId: 1,
            quantity: 1,
          },
        ],
        payment: {
          number: '4242424242424242',
          expMonth: '06',
          expYear: '29',
          cvc: '123',
          cardHolder: 'Pedro Perez',
        },
      }),
    ).rejects.toThrow(NotFoundException);

    expect(paymentGatewayService.getAcceptanceTokens).not.toHaveBeenCalled();
  });

  it('should throw when a product is missing', async () => {
    customerRepository.findOneBy.mockResolvedValue(customer);
    productRepository.find.mockResolvedValue([products[0]]);

    await expect(
      service.checkout({
        customerId: 1,
        items: [
          {
            productId: 1,
            quantity: 1,
          },
          {
            productId: 2,
            quantity: 1,
          },
        ],
        payment: {
          number: '4242424242424242',
          expMonth: '06',
          expYear: '29',
          cvc: '123',
          cardHolder: 'Pedro Perez',
        },
      }),
    ).rejects.toThrow(NotFoundException);

    expect(paymentGatewayService.getAcceptanceTokens).not.toHaveBeenCalled();
  });

  it('should throw when there is not enough stock', async () => {
    customerRepository.findOneBy.mockResolvedValue(customer);
    productRepository.find.mockResolvedValue([
      {
        ...products[0],
        stock: 1,
      },
    ]);

    await expect(
      service.checkout({
        customerId: 1,
        items: [
          {
            productId: 1,
            quantity: 2,
          },
        ],
        payment: {
          number: '4242424242424242',
          expMonth: '06',
          expYear: '29',
          cvc: '123',
          cardHolder: 'Pedro Perez',
        },
      }),
    ).rejects.toThrow(ConflictException);

    expect(paymentGatewayService.getAcceptanceTokens).not.toHaveBeenCalled();
  });
});
