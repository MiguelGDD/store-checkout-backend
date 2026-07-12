import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { join } from 'path';
import 'dotenv/config';
import { buildPostgresOptions } from './database-options';

export default new DataSource({
  ...buildPostgresOptions({
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }),
  entities: [join(__dirname, 'domain', 'entities', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
});
