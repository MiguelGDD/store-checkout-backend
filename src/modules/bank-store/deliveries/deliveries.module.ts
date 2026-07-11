import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from '../../core/database/domain/entities/delivery.entity';
import { Transaction } from '../../core/database/domain/entities/transaction.entity';
import { DeliveriesController } from './infrastructure/controllers/deliveries.controller';
import { DeliveriesService } from './infrastructure/services/deliveries.service';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery, Transaction])],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
