import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateTransactionDto } from './create-transaction.dto';
import { CreateTransactionItemDto } from './create-transaction-item.dto';
import { CreateTransactionPaymentDto } from './create-transaction-payment.dto';

describe('Transaction DTOs', () => {
  it('should validate a transaction item dto', () => {
    const dto = plainToInstance(CreateTransactionItemDto, {
      productId: 1,
      quantity: 2,
    });

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('should reject invalid transaction item values', () => {
    const dto = plainToInstance(CreateTransactionItemDto, {
      productId: 0,
      quantity: 0,
    });

    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('should validate a payment dto', () => {
    const dto = plainToInstance(CreateTransactionPaymentDto, {
      number: '4242424242424242',
      expMonth: '06',
      expYear: '29',
      cvc: '123',
      cardHolder: 'Pedro Perez',
    });

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('should reject invalid payment values', () => {
    const dto = plainToInstance(CreateTransactionPaymentDto, {
      number: 'abc',
      expMonth: '13',
      expYear: '2',
      cvc: '12',
      cardHolder: 'A',
    });

    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('should validate a transaction dto with an optional delivery fee', () => {
    const dto = plainToInstance(CreateTransactionDto, {
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
      deliveryFee: 1500,
    });

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('should validate a transaction dto without the optional delivery fee', () => {
    const dto = plainToInstance(CreateTransactionDto, {
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
    });

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('should reject invalid transaction dto structures', () => {
    const dto = plainToInstance(CreateTransactionDto, {
      customerId: 0,
      items: [],
      payment: {
        number: 'abc',
        expMonth: '00',
        expYear: '2',
        cvc: '12',
        cardHolder: 'A',
      },
      deliveryFee: -1,
    });

    expect(validateSync(dto).length).toBeGreaterThan(0);
  });
});
