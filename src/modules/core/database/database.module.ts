import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { buildPostgresOptions } from './database-options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...buildPostgresOptions({
          url: configService.get<string>('app.database.url'),
          host: configService.get<string>('app.database.host'),
          port: configService.get<number>('app.database.port'),
          username: configService.get<string>('app.database.username'),
          password: configService.get<string>('app.database.password'),
          database: configService.get<string>('app.database.name'),
        }),
        autoLoadEntities: true,
        migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
      }),
    }),
  ],
})
export class DatabaseModule {}
