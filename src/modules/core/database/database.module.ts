import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('app.database.host'),
        port: configService.getOrThrow<number>('app.database.port'),
        username: configService.getOrThrow<string>('app.database.username'),
        password: configService.getOrThrow<string>('app.database.password'),
        database: configService.getOrThrow<string>('app.database.name'),
        autoLoadEntities: true,
        synchronize: false,
        logging: false,
        migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
      }),
    }),
  ],
})
export class DatabaseModule {}
