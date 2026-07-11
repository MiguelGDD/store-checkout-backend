import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateTransactionItemDto } from './create-transaction-item.dto';
import { CreateTransactionPaymentDto } from './create-transaction-payment.dto';

export class CreateTransactionDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId: number;

  @ApiProperty({ type: [CreateTransactionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items: CreateTransactionItemDto[];

  @ApiProperty({ type: CreateTransactionPaymentDto })
  @ValidateNested()
  @Type(() => CreateTransactionPaymentDto)
  payment: CreateTransactionPaymentDto;

  @ApiPropertyOptional({
    example: 'Optional field reserved for future delivery fee configuration.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  deliveryFee?: number;
}
