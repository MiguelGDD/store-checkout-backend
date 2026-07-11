import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config';
import { ApiKeyMiddleware } from './common/middleware/api-key.middleware';
import { DatabaseModule } from './modules/core/database/database.module';
import { HealthCheckModule } from './modules/core/health-check/health-check.module';
import { ProductsModule } from './modules/bank-store/products/products.module';
import { TransactionsModule } from './modules/bank-store/transactions/transactions.module';
import { DeliveriesModule } from './modules/bank-store/deliveries/deliveries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    DatabaseModule,
    HealthCheckModule,
    ProductsModule,
    TransactionsModule,
    DeliveriesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'docs', method: RequestMethod.ALL },
        { path: 'docs/(.*)', method: RequestMethod.ALL },
        { path: 'docs-json', method: RequestMethod.ALL },
        { path: 'docs-yaml', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
