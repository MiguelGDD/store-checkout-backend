import {
  BadGatewayException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Customer } from '../../../../core/database/domain/entities/customer.entity';
import { Product } from '../../../../core/database/domain/entities/product.entity';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import { TransactionStatus } from '../../../../core/database/domain/enums';
import { DeliveriesService } from '../../../deliveries/infrastructure/services/deliveries.service';
import { ProductsService } from '../../../products/infrastructure/services/products.service';
import { CustomerRepositoryPort } from '../../../shared/domain/ports/customer.repository.port';
import {
  ProductRepositoryPort,
  TransactionProductRepositoryPort,
} from '../../../shared/domain/ports/product.repository.port';
import { PaymentGatewayPort } from '../../../shared/domain/ports/payment-gateway.port';
import { TransactionRepositoryPort } from '../../../shared/domain/ports/transaction.repository.port';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  type TransactionsServiceInternals = {
    mapProviderStatus: (
      status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING',
    ) => TransactionStatus;
    findOneOrFail: (id: number) => Promise<Transaction>;
  };

  let transactionRepository: jest.Mocked<TransactionRepositoryPort>;
  let customerRepository: jest.Mocked<CustomerRepositoryPort>;
  let productRepository: jest.Mocked<ProductRepositoryPort>;
  let transactionProductRepository: jest.Mocked<TransactionProductRepositoryPort>;
  let paymentGatewayService: jest.Mocked<PaymentGatewayPort>;
  let productsService: {
    discountPurchasedProducts: jest.Mock;
  };
  let deliveriesService: {
    assignToTransaction: jest.Mock;
  };

  const customer = {
    id: 1,
    email: 'juan.perez@example.com',
    address: 'Cra 1 # 2-3',
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

  const pendingTransaction = {
    id: 10,
    reference: 'reference-1',
    status: TransactionStatus.PENDING,
    totalAmount: 2600,
    baseFee: 2500,
    deliveryFee: 100,
    bankTransactionId: null,
    customer,
    transactionProducts: [],
    delivery: undefined as unknown as Transaction['delivery'],
    createAt: new Date(),
    updateAt: new Date(),
  } as Transaction;

  beforeEach(() => {
    transactionRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByReference: jest.fn(),
      findByReferenceWithCustomer: jest.fn(),
      createPending: jest.fn(),
      updateStatus: jest.fn(),
    };

    customerRepository = {
      findById: jest.fn(),
    };

    productRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      updateStock: jest.fn(),
    };

    transactionProductRepository = {
      saveMany: jest.fn(),
      findByTransactionId: jest.fn(),
    };

    paymentGatewayService = {
      getAcceptanceTokens: jest.fn(),
      tokenizeCard: jest.fn(),
      createTransaction: jest.fn(),
      getTransaction: jest.fn(),
      waitForFinalTransaction: jest.fn(),
    };

    productsService = {
      discountPurchasedProducts: jest.fn(),
    };

    deliveriesService = {
      assignToTransaction: jest.fn(),
    };

    service = new TransactionsService(
      transactionRepository,
      customerRepository,
      productRepository,
      transactionProductRepository,
      paymentGatewayService,
      productsService as unknown as ProductsService,
      deliveriesService as unknown as DeliveriesService,
    );
  });

  it('should return all transactions ordered by creation date', async () => {
    const transactions = [{ id: 1 }] as Transaction[];
    transactionRepository.findAll.mockResolvedValue(transactions);

    await expect(service.findAll()).resolves.toEqual(transactions);
    expect(transactionRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return one transaction by id', async () => {
    const transaction = { id: 1 } as Transaction;
    transactionRepository.findById.mockResolvedValue(transaction);

    await expect(service.findOne(1)).resolves.toEqual(transaction);
    expect(transactionRepository.findById).toHaveBeenCalledWith(1);
  });

  it('should complete a checkout when the payment is approved', async () => {
    const finalTransaction = {
      ...pendingTransaction,
      status: TransactionStatus.APPROVED,
      bankTransactionId: 'provider-transaction-id',
    } as Transaction;

    customerRepository.findById.mockResolvedValue(customer);
    productRepository.findByIds.mockResolvedValue(products);
    transactionRepository.createPending.mockResolvedValue(pendingTransaction);
    transactionProductRepository.saveMany.mockResolvedValue([]);
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
    } as never);
    paymentGatewayService.waitForFinalTransaction.mockResolvedValue({
      id: 'provider-transaction-id',
      reference: 'reference-1',
      amount_in_cents: 260000,
      currency: 'COP',
      status: 'APPROVED',
    } as never);
    transactionRepository.findById.mockResolvedValue(finalTransaction);
    deliveriesService.assignToTransaction.mockResolvedValue({
      id: 20,
      status: 'ASSIGNED',
    } as never);

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

    expect(customerRepository.findById).toHaveBeenCalledWith(1);
    expect(productRepository.findByIds).toHaveBeenCalledWith([1, 2]);
    expect(transactionRepository.createPending).toHaveBeenCalledWith({
      reference: expect.any(String),
      totalAmount: 2600,
      baseFee: 2500,
      deliveryFee: 100,
      customerId: 1,
    });
    expect(transactionProductRepository.saveMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          quantity: 2,
          unitAmount: 1000,
        }),
        expect.objectContaining({
          quantity: 1,
          unitAmount: 500,
        }),
      ]),
    );
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
    expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
      10,
      TransactionStatus.APPROVED,
      'provider-transaction-id',
    );
    expect(productsService.discountPurchasedProducts).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10 }),
    );
    expect(deliveriesService.assignToTransaction).toHaveBeenCalledWith(10);
  });

  it('should mark the transaction as declined when the provider declines it', async () => {
    const declinedTransaction = {
      ...pendingTransaction,
      status: TransactionStatus.DECLINED,
      bankTransactionId: 'provider-transaction-id-2',
    } as Transaction;

    customerRepository.findById.mockResolvedValue(customer);
    productRepository.findByIds.mockResolvedValue([products[0]]);
    transactionRepository.createPending.mockResolvedValue(pendingTransaction);
    transactionProductRepository.saveMany.mockResolvedValue([]);
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
    } as never);
    transactionRepository.findById.mockResolvedValue(declinedTransaction);

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
    expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
      10,
      TransactionStatus.DECLINED,
      'provider-transaction-id-2',
    );
    expect(productsService.discountPurchasedProducts).not.toHaveBeenCalled();
    expect(deliveriesService.assignToTransaction).not.toHaveBeenCalled();
  });

  it('should map a voided provider transaction', async () => {
    const voidedTransaction = {
      ...pendingTransaction,
      status: TransactionStatus.VOIDED,
      bankTransactionId: 'provider-transaction-id-3',
    } as Transaction;

    customerRepository.findById.mockResolvedValue(customer);
    productRepository.findByIds.mockResolvedValue([products[0]]);
    transactionRepository.createPending.mockResolvedValue(pendingTransaction);
    transactionProductRepository.saveMany.mockResolvedValue([]);
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
    } as never);
    paymentGatewayService.waitForFinalTransaction.mockResolvedValue({
      id: 'provider-transaction-id-3',
      reference: 'reference-3',
      amount_in_cents: 150000,
      currency: 'COP',
      status: 'VOIDED',
    } as never);
    transactionRepository.findById.mockResolvedValue(voidedTransaction);

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

    expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
      10,
      TransactionStatus.VOIDED,
      'provider-transaction-id-3',
    );
    expect(productsService.discountPurchasedProducts).not.toHaveBeenCalled();
    expect(deliveriesService.assignToTransaction).not.toHaveBeenCalled();
  });

  it('should mark the transaction as error when the provider call fails', async () => {
    customerRepository.findById.mockResolvedValue(customer);
    productRepository.findByIds.mockResolvedValue([products[0]]);
    transactionRepository.createPending.mockResolvedValue(pendingTransaction);
    transactionProductRepository.saveMany.mockResolvedValue([]);
    paymentGatewayService.getAcceptanceTokens.mockResolvedValue({
      acceptanceToken: 'acceptance-token',
      personalAuthToken: 'personal-token',
    });
    paymentGatewayService.tokenizeCard.mockResolvedValue('card-token');
    paymentGatewayService.createTransaction.mockRejectedValue(
      new BadGatewayException('provider error'),
    );

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

    expect(transactionRepository.updateStatus).toHaveBeenCalledWith(
      10,
      TransactionStatus.ERROR,
    );
    expect(productsService.discountPurchasedProducts).not.toHaveBeenCalled();
    expect(deliveriesService.assignToTransaction).not.toHaveBeenCalled();
  });

  it('should throw when customer does not exist', async () => {
    customerRepository.findById.mockResolvedValue(null);

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
    customerRepository.findById.mockResolvedValue(customer);
    productRepository.findByIds.mockResolvedValue([products[0]]);

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

  it('should throw when loaded products are inconsistent', async () => {
    customerRepository.findById.mockResolvedValue(customer);
    productRepository.findByIds.mockResolvedValue([
      {
        ...products[0],
      },
      {
        ...products[0],
      },
    ]);

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
    customerRepository.findById.mockResolvedValue(customer);
    productRepository.findByIds.mockResolvedValue([
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

  it('should throw when the transaction cannot be reloaded after approval', async () => {
    customerRepository.findById.mockResolvedValue(customer);
    productRepository.findByIds.mockResolvedValue([products[0]]);
    transactionRepository.createPending.mockResolvedValue(pendingTransaction);
    transactionProductRepository.saveMany.mockResolvedValue([]);
    paymentGatewayService.getAcceptanceTokens.mockResolvedValue({
      acceptanceToken: 'acceptance-token',
      personalAuthToken: 'personal-token',
    });
    paymentGatewayService.tokenizeCard.mockResolvedValue('card-token');
    paymentGatewayService.createTransaction.mockResolvedValue({
      id: 'provider-transaction-id',
      reference: 'reference-1',
      amount_in_cents: 100000,
      currency: 'COP',
      status: 'APPROVED',
    } as never);
    paymentGatewayService.waitForFinalTransaction.mockResolvedValue({
      id: 'provider-transaction-id',
      reference: 'reference-1',
      amount_in_cents: 100000,
      currency: 'COP',
      status: 'APPROVED',
    } as never);
    transactionRepository.findById.mockResolvedValueOnce(null);
    deliveriesService.assignToTransaction.mockResolvedValue({
      id: 20,
      status: 'ASSIGNED',
    } as never);

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

    expect(productsService.discountPurchasedProducts).toHaveBeenCalled();
    expect(deliveriesService.assignToTransaction).toHaveBeenCalledWith(10);
  });

  it('should map provider pending status to pending and errors to error', () => {
    const internalService = service as unknown as TransactionsServiceInternals;

    expect(internalService.mapProviderStatus('ERROR')).toBe(
      TransactionStatus.ERROR,
    );
    expect(internalService.mapProviderStatus('PENDING')).toBe(
      TransactionStatus.PENDING,
    );
  });

  it('should throw when a transaction cannot be found after processing', async () => {
    transactionRepository.findById.mockResolvedValue(null);

    const internalService = service as unknown as TransactionsServiceInternals;

    await expect(internalService.findOneOrFail(10)).rejects.toThrow(
      NotFoundException,
    );
  });
});
