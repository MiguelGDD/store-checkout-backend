import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'store_checkout',
  },
  security: {
    apiKey: process.env.API_KEY ?? '',
  },
  payment: {
    apiUrl: process.env.PAYMENT_API_URL ?? '',
    publicKey: process.env.PAYMENT_PUBLIC_KEY ?? '',
    secretKey: process.env.PAYMENT_SECRET_KEY ?? '',
  },
}));
