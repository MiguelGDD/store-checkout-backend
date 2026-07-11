import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { firstValueFrom } from 'rxjs';
import type {
  AcceptanceTokensInput,
  CardPaymentInput,
  CreatePaymentTransactionInput,
  ProviderTransaction,
  ProviderTransactionStatus,
} from '../../transactions.types';

interface MerchantAcceptanceResponse {
  data?: {
    presigned_acceptance?: {
      acceptance_token?: string;
    };
    presigned_personal_data_auth?: {
      acceptance_token?: string;
    };
  };
}

interface TokenizationResponse {
  data?: {
    id?: string;
  };
}

interface TransactionResponse {
  data?: ProviderTransaction;
}

@Injectable()
export class PaymentGatewayService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getAcceptanceTokens(): Promise<AcceptanceTokensInput> {
    const response = await firstValueFrom(
      this.httpService.get<MerchantAcceptanceResponse>(
        `${this.apiUrl}/merchants/${this.publicKey}`,
      ),
    );

    const acceptanceToken =
      response.data?.data?.presigned_acceptance?.acceptance_token;
    const personalAuthToken =
      response.data?.data?.presigned_personal_data_auth?.acceptance_token;

    if (!acceptanceToken || !personalAuthToken) {
      throw new BadGatewayException(
        'Unable to load acceptance tokens from the payment provider',
      );
    }

    return {
      acceptanceToken,
      personalAuthToken,
    };
  }

  async tokenizeCard(card: CardPaymentInput): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post<TokenizationResponse>(
        `${this.apiUrl}/tokens/cards`,
        {
          number: card.number,
          exp_month: card.expMonth,
          exp_year: card.expYear,
          cvc: card.cvc,
          card_holder: card.cardHolder,
        },
        {
          headers: {
            Authorization: `Bearer ${this.publicKey}`,
          },
        },
      ),
    );

    const token = response.data?.data?.id;

    if (!token) {
      throw new BadGatewayException(
        'Unable to tokenize the selected payment method',
      );
    }

    return token;
  }

  async createTransaction(
    input: CreatePaymentTransactionInput,
  ): Promise<ProviderTransaction> {
    const response = await firstValueFrom(
      this.httpService.post<TransactionResponse>(
        `${this.apiUrl}/transactions`,
        {
          acceptance_token: input.acceptanceToken,
          accept_personal_auth: input.acceptPersonalAuthToken,
          amount_in_cents: input.amountInCents,
          currency: input.currency,
          customer_email: input.customerEmail,
          payment_method: {
            type: 'CARD',
            token: input.paymentToken,
            installments: 1,
          },
          payment_method_type: 'CARD',
          reference: input.reference,
          signature: this.buildIntegritySignature(
            input.reference,
            input.amountInCents,
            input.currency,
          ),
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      ),
    );

    const transaction = response.data?.data;

    if (!transaction?.id) {
      throw new BadGatewayException('Unable to create the payment transaction');
    }

    return transaction;
  }

  async getTransaction(transactionId: string): Promise<ProviderTransaction> {
    const response = await firstValueFrom(
      this.httpService.get<TransactionResponse>(
        `${this.apiUrl}/transactions/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.publicKey}`,
          },
        },
      ),
    );

    const transaction = response.data?.data;

    if (!transaction?.id) {
      throw new BadGatewayException(
        'Unable to fetch the payment transaction status',
      );
    }

    return transaction;
  }

  async waitForFinalTransaction(
    transactionId: string,
    maxAttempts = 12,
    pollDelayMs = 1000,
  ): Promise<ProviderTransaction> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const transaction = await this.getTransaction(transactionId);

      if (this.isFinalStatus(transaction.status)) {
        return transaction;
      }

      if (attempt < maxAttempts - 1) {
        await this.delay(pollDelayMs);
      }
    }

    throw new BadGatewayException(
      'The payment transaction did not reach a final status in time',
    );
  }

  private async delay(milliseconds: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  private isFinalStatus(status: ProviderTransactionStatus): boolean {
    return status !== 'PENDING';
  }

  private buildIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): string {
    const rawSignature = `${reference}${amountInCents}${currency}${this.integritySecret}`;

    return createHash('sha256').update(rawSignature).digest('hex');
  }

  private get apiUrl(): string {
    return this.configService.getOrThrow<string>('app.payment.apiUrl');
  }

  private get publicKey(): string {
    return this.configService.getOrThrow<string>('app.payment.publicKey');
  }

  private get secretKey(): string {
    return this.configService.getOrThrow<string>('app.payment.secretKey');
  }

  private get integritySecret(): string {
    return this.configService.getOrThrow<string>('app.payment.integritySecret');
  }
}
