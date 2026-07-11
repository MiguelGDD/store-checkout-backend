import { NotFoundException } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from '../services/transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: {
    checkout: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(() => {
    transactionsService = {
      checkout: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    controller = new TransactionsController(
      transactionsService as unknown as TransactionsService,
    );
  });

  it('should delegate checkout requests to the service', async () => {
    const transaction = { id: 1 };
    const dto = {
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
    };

    transactionsService.checkout.mockResolvedValue(transaction);

    await expect(controller.checkout(dto as never)).resolves.toBe(transaction);
    expect(transactionsService.checkout).toHaveBeenCalledWith(dto);
  });

  it('should delegate list requests to the service', async () => {
    const transactions = [{ id: 1 }];
    transactionsService.findAll.mockResolvedValue(transactions);

    await expect(controller.findAll()).resolves.toBe(transactions);
    expect(transactionsService.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return a transaction by id', async () => {
    const transaction = { id: 1 };
    transactionsService.findOne.mockResolvedValue(transaction);

    await expect(controller.findOne(1)).resolves.toBe(transaction);
    expect(transactionsService.findOne).toHaveBeenCalledWith(1);
  });

  it('should throw when the transaction does not exist', async () => {
    transactionsService.findOne.mockResolvedValue(null);

    await expect(controller.findOne(1)).rejects.toThrow(NotFoundException);
  });
});
