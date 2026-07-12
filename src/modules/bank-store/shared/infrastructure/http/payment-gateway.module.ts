import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PAYMENT_GATEWAY } from '../../domain/ports/payment-gateway.port';
import { PaymentGatewayService } from '../../../transactions/infrastructure/services/payment-gateway.service';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [
    PaymentGatewayService,
    {
      provide: PAYMENT_GATEWAY,
      useExisting: PaymentGatewayService,
    },
  ],
  exports: [PAYMENT_GATEWAY],
})
export class PaymentGatewayModule {}
