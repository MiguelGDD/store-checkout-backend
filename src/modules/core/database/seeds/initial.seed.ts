import 'reflect-metadata';
import dataSource from '../data-source';
import { Customer } from '../domain/entities/customer.entity';
import { Product } from '../domain/entities/product.entity';

async function bootstrap() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.query(`
      TRUNCATE TABLE
        "deliveries",
        "transaction_products",
        "transactions",
        "products",
        "customers"
      RESTART IDENTITY CASCADE
    `);

    const customers: Partial<Customer>[] = [
      {
        name: 'Juan Perez',
        email: 'juan.perez@example.com',
        address: 'Calle 123 #45-67, Bogota',
        phone: '3001234567',
        legalNumber: '1002003001',
        legalType: 'CC',
      },
      {
        name: 'Maria Gomez',
        email: 'maria.gomez@example.com',
        address: 'Carrera 10 #20-30, Medellin',
        phone: '3012345678',
        legalNumber: '2003004005',
        legalType: 'CC',
      },
    ];

    const products: Partial<Product>[] = [
      {
        name: 'Smartphone X',
        description: 'High-end smartphone with OLED display and 128GB storage.',
        price: 2500000,
        stock: 12,
        image: 'https://example.com/products/smartphone-x.png',
      },
      {
        name: 'Wireless Headphones',
        description: 'Noise-cancelling wireless headphones with 30h battery.',
        price: 450000,
        stock: 25,
        image: 'https://example.com/products/wireless-headphones.png',
      },
      {
        name: 'Smartwatch Pro',
        description: 'Fitness smartwatch with GPS, heart rate and NFC.',
        price: 780000,
        stock: 18,
        image: 'https://example.com/products/smartwatch-pro.png',
      },
    ];

    await queryRunner.manager.save(Customer, customers);
    await queryRunner.manager.save(Product, products);

    await queryRunner.commitTransaction();
    process.stdout.write('Seed completed\n');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

void bootstrap();
