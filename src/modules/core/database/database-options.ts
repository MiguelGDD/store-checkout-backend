import { DataSourceOptions } from 'typeorm';

export type DatabaseConnectionInput = {
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
};

export const buildPostgresOptions = (
  input: DatabaseConnectionInput,
): DataSourceOptions => {
  const baseOptions = {
    type: 'postgres' as const,
    synchronize: false,
    logging: false,
  };

  if (input.url) {
    return {
      ...baseOptions,
      url: input.url,
    };
  }

  return {
    ...baseOptions,
    host: input.host ?? 'localhost',
    port: input.port ?? 5432,
    username: input.username ?? 'postgres',
    password: input.password ?? 'postgres',
    database: input.database ?? 'store_checkout',
  };
};
