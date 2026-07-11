import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateTransactionPaymentDto {
  @ApiProperty({ example: '4242424242424242' })
  @IsString()
  @Matches(/^\d{13,19}$/)
  number: string;

  @ApiProperty({ example: '06' })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/)
  expMonth: string;

  @ApiProperty({ example: '29' })
  @IsString()
  @Matches(/^\d{2}$/)
  expYear: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @Matches(/^\d{3,4}$/)
  cvc: string;

  @ApiProperty({ example: 'Pedro Perez' })
  @IsString()
  @Length(5, 255)
  cardHolder: string;
}
