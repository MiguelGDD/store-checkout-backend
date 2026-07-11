import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Transaction } from '../../../../core/database/domain/entities/transaction.entity';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { TransactionsService } from '../services/transactions.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async checkout(@Body() dto: CreateTransactionDto): Promise<Transaction> {
    return this.transactionsService.checkout(dto);
  }

  @Get()
  async findAll(): Promise<Transaction[]> {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Transaction> {
    const transaction = await this.transactionsService.findOne(id);

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }
}
