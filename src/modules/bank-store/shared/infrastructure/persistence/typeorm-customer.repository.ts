import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../../../core/database/domain/entities/customer.entity';
import { CustomerRepositoryPort } from '../../domain/ports/customer.repository.port';

@Injectable()
export class TypeOrmCustomerRepository implements CustomerRepositoryPort {
  constructor(
    @InjectRepository(Customer)
    private readonly repository: Repository<Customer>,
  ) {}

  findById(id: number): Promise<Customer | null> {
    return this.repository.findOneBy({ id });
  }
}
