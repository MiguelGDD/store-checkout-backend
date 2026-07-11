import { HttpService } from '@nestjs/axios';
import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { of } from 'rxjs';
import { PaymentGatewayService } from './payment-gateway.service';

describe('PaymentGatewayService', () => {
  let service: PaymentGatewayService;
  let httpService: {
    get: jest.Mock;
    post: jest.Mock;
  };
  let configService: {
    getOrThrow: jest.Mock;
  };

  beforeEach(() => {
    httpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'app.payment.apiUrl': 'https://sandbox.example.com/v1',
          'app.payment.publicKey': 'pub_test_key',
          'app.payment.secretKey': 'prv_test_key',
          'app.payment.integritySecret': 'int_test_key',
        };

        return values[key];
      }),
    };

    service = new PaymentGatewayService(
      httpService as unknown as HttpService,
      configService as unknown as ConfigService,
    );
  });

  it('should get acceptance tokens from merchant data', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          data: {
            presigned_acceptance: {
              acceptance_token: 'acceptance-token',
            },
            presigned_personal_data_auth: {
              acceptance_token: 'personal-token',
            },
          },
        },
      }),
    );

    await expect(service.getAcceptanceTokens()).resolves.toEqual({
      acceptanceToken: 'acceptance-token',
      personalAuthToken: 'personal-token',
    });

    expect(httpService.get).toHaveBeenCalledWith(
      'https://sandbox.example.com/v1/merchants/pub_test_key',
    );
  });

  it('should tokenize a card with the public key', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          data: {
            id: 'card-token',
          },
        },
      }),
    );

    await expect(
      service.tokenizeCard({
        number: '4242424242424242',
        expMonth: '06',
        expYear: '29',
        cvc: '123',
        cardHolder: 'Pedro Perez',
      }),
    ).resolves.toBe('card-token');

    expect(httpService.post).toHaveBeenCalledWith(
      'https://sandbox.example.com/v1/tokens/cards',
      {
        number: '4242424242424242',
        exp_month: '06',
        exp_year: '29',
        cvc: '123',
        card_holder: 'Pedro Perez',
      },
      {
        headers: {
          Authorization: 'Bearer pub_test_key',
        },
      },
    );
  });

  it('should create a transaction with the integrity signature', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          data: {
            id: 'provider-transaction-id',
            reference: 'reference-1',
            amount_in_cents: 100000,
            currency: 'COP',
            status: 'APPROVED',
          },
        },
      }),
    );

    await expect(
      service.createTransaction({
        acceptanceToken: 'acceptance-token',
        acceptPersonalAuthToken: 'personal-token',
        amountInCents: 100000,
        currency: 'COP',
        customerEmail: 'juan.perez@example.com',
        paymentToken: 'card-token',
        reference: 'reference-1',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'provider-transaction-id',
        status: 'APPROVED',
      }),
    );

    const requestBody = httpService.post.mock.calls[0][1];

    expect(requestBody).toMatchObject({
      acceptance_token: 'acceptance-token',
      accept_personal_auth: 'personal-token',
      amount_in_cents: 100000,
      currency: 'COP',
      customer_email: 'juan.perez@example.com',
      payment_method: {
        type: 'CARD',
        token: 'card-token',
        installments: 1,
      },
      payment_method_type: 'CARD',
      reference: 'reference-1',
    });

    expect(requestBody.signature).toBe(
      createHash('sha256')
        .update('reference-1100000COPint_test_key')
        .digest('hex'),
    );

    expect(httpService.post).toHaveBeenCalledWith(
      'https://sandbox.example.com/v1/transactions',
      expect.any(Object),
      {
        headers: {
          Authorization: 'Bearer prv_test_key',
        },
      },
    );
  });

  it('should get the transaction status with the public key', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          data: {
            id: 'provider-transaction-id',
            reference: 'reference-1',
            amount_in_cents: 100000,
            currency: 'COP',
            status: 'PENDING',
          },
        },
      }),
    );

    await expect(
      service.getTransaction('provider-transaction-id'),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'provider-transaction-id',
        status: 'PENDING',
      }),
    );

    expect(httpService.get).toHaveBeenCalledWith(
      'https://sandbox.example.com/v1/transactions/provider-transaction-id',
      {
        headers: {
          Authorization: 'Bearer pub_test_key',
        },
      },
    );
  });

  it('should poll the transaction until it reaches a final status', async () => {
    httpService.get
      .mockReturnValueOnce(
        of({
          data: {
            data: {
              id: 'provider-transaction-id',
              reference: 'reference-1',
              amount_in_cents: 100000,
              currency: 'COP',
              status: 'PENDING',
            },
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            data: {
              id: 'provider-transaction-id',
              reference: 'reference-1',
              amount_in_cents: 100000,
              currency: 'COP',
              status: 'APPROVED',
            },
          },
        }),
      );

    await expect(
      service.waitForFinalTransaction('provider-transaction-id', 2, 0),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'provider-transaction-id',
        status: 'APPROVED',
      }),
    );

    expect(httpService.get).toHaveBeenCalledTimes(2);
  });

  it('should fail when the transaction never reaches a final status', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          data: {
            id: 'provider-transaction-id',
            reference: 'reference-1',
            amount_in_cents: 100000,
            currency: 'COP',
            status: 'PENDING',
          },
        },
      }),
    );

    await expect(
      service.waitForFinalTransaction('provider-transaction-id', 1, 0),
    ).rejects.toThrow(BadGatewayException);
  });
});
