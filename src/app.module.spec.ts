import { MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppModule } from './app.module';
import { ApiKeyMiddleware } from './common/middleware/api-key.middleware';

describe('AppModule', () => {
  it('applies the API key middleware to protected routes only', () => {
    const apply = jest.fn().mockReturnThis();
    const exclude = jest.fn().mockReturnThis();
    const forRoutes = jest.fn().mockReturnThis();

    const consumer = {
      apply,
      exclude,
      forRoutes,
    } as unknown as MiddlewareConsumer;

    new AppModule().configure(consumer);

    expect(apply).toHaveBeenCalledWith(ApiKeyMiddleware);
    expect(exclude).toHaveBeenCalledWith(
      { path: 'health', method: RequestMethod.ALL },
      { path: 'docs', method: RequestMethod.ALL },
      { path: 'docs/(.*)', method: RequestMethod.ALL },
      { path: 'docs-json', method: RequestMethod.ALL },
      { path: 'docs-yaml', method: RequestMethod.ALL },
    );
    expect(forRoutes).toHaveBeenCalledWith('*');
  });
});
