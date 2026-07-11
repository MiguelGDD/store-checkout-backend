import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'email', type: 'varchar', length: '255', isUnique: true },
          { name: 'address', type: 'varchar', length: '255' },
          { name: 'phone', type: 'varchar', length: '20' },
          {
            name: 'legal_number',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          { name: 'legal_type', type: 'varchar', length: '10' },
          {
            name: 'create_at',
            type: 'timestamptz',
            default: () => 'CURRENT_TIMESTAMP',
          },
          {
            name: 'update_at',
            type: 'timestamptz',
            default: () => 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '255', isUnique: true },
          { name: 'description', type: 'text' },
          { name: 'price', type: 'int' },
          { name: 'stock', type: 'int' },
          { name: 'image', type: 'varchar', length: '255' },
          {
            name: 'create_at',
            type: 'timestamptz',
            default: () => 'CURRENT_TIMESTAMP',
          },
          {
            name: 'update_at',
            type: 'timestamptz',
            default: () => 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_price_stock',
        columnNames: ['price', 'stock'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '36',
            isUnique: true,
          },
          { name: 'total_amount', type: 'int' },
          { name: 'base_fee', type: 'int' },
          { name: 'delivery_fee', type: 'int' },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: 'PENDING',
          },
          {
            name: 'bank_transaction_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'customer_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'create_at',
            type: 'timestamptz',
            default: () => 'CURRENT_TIMESTAMP',
          },
          {
            name: 'update_at',
            type: 'timestamptz',
            default: () => 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'IDX_transactions_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        name: 'FK_transactions_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'NO ACTION',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'transaction_products',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'quantity', type: 'int' },
          { name: 'unit_amount', type: 'int' },
          {
            name: 'transaction_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'create_at',
            type: 'timestamptz',
            default: () => 'CURRENT_TIMESTAMP',
          },
          {
            name: 'update_at',
            type: 'timestamptz',
            default: () => 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'transaction_products',
      new TableIndex({
        name: 'IDX_transaction_products_transaction',
        columnNames: ['transaction_id'],
      }),
    );

    await queryRunner.createIndex(
      'transaction_products',
      new TableIndex({
        name: 'IDX_transaction_products_product',
        columnNames: ['product_id'],
      }),
    );

    await queryRunner.createForeignKeys('transaction_products', [
      new TableForeignKey({
        name: 'FK_transaction_products_transaction',
        columnNames: ['transaction_id'],
        referencedTableName: 'transactions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION',
      }),
      new TableForeignKey({
        name: 'FK_transaction_products_product',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'NO ACTION',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'deliveries',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'address', type: 'varchar', length: '255' },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: 'PENDING',
          },
          {
            name: 'customer_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'transaction_id',
            type: 'int',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'create_at',
            type: 'timestamptz',
            default: () => 'CURRENT_TIMESTAMP',
          },
          {
            name: 'update_at',
            type: 'timestamptz',
            default: () => 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_deliveries_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'deliveries',
      new TableIndex({
        name: 'IDX_deliveries_customer',
        columnNames: ['customer_id'],
      }),
    );

    await queryRunner.createForeignKeys('deliveries', [
      new TableForeignKey({
        name: 'FK_deliveries_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'NO ACTION',
      }),
      new TableForeignKey({
        name: 'FK_deliveries_transaction',
        columnNames: ['transaction_id'],
        referencedTableName: 'transactions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('deliveries', true);
    await queryRunner.dropTable('transaction_products', true);
    await queryRunner.dropTable('transactions', true);
    await queryRunner.dropTable('products', true);
    await queryRunner.dropTable('customers', true);
  }
}
