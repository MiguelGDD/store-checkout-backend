import { Module } from '@nestjs/common';
import { BankStorePersistenceModule } from '../shared/infrastructure/persistence/bank-store-persistence.module';
import { DeliveriesController } from './infrastructure/controllers/deliveries.controller';
import { DeliveriesService } from './infrastructure/services/deliveries.service';

@Module({
  imports: [BankStorePersistenceModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
