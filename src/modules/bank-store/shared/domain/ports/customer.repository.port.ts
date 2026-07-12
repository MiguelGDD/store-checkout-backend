import { Customer } from '../../../../core/database/domain/entities/customer.entity';

export const CUSTOMER_REPOSITORY = 'CUSTOMER_REPOSITORY';

export interface CustomerRepositoryPort {
  findById(id: number): Promise<Customer | null>;
}
