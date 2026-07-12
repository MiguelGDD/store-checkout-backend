import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../../../../core/database/domain/entities/product.entity';
import { ProductRepositoryPort } from '../../domain/ports/product.repository.port';

@Injectable()
export class TypeOrmProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  findAll(): Promise<Product[]> {
    return this.repository.find({
      order: { name: 'ASC' },
    });
  }

  findById(id: number): Promise<Product | null> {
    return this.repository.findOneBy({ id });
  }

  findByIds(ids: number[]): Promise<Product[]> {
    return this.repository.find({
      where: { id: In(ids) },
    });
  }

  async updateStock(id: number, stock: number): Promise<void> {
    await this.repository.update({ id }, { stock });
  }
}
