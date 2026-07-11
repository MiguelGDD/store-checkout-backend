import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Delivery } from '../../../../core/database/domain/entities/delivery.entity';
import { DeliveriesService } from '../services/deliveries.service';

@ApiTags('Deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  async findAll(): Promise<Delivery[]> {
    return this.deliveriesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Delivery> {
    const delivery = await this.deliveriesService.findOne(id);

    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }

    return delivery;
  }

  @Post('assign/:transactionId')
  async assign(
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ): Promise<Delivery> {
    return this.deliveriesService.assignToTransaction(transactionId);
  }
}
