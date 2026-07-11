import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ApiKeyMiddleware } from './api-key.middleware';

describe('ApiKeyMiddleware', () => {
  const mockConfigService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  const middleware = new ApiKeyMiddleware(mockConfigService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows the request when the API key matches', () => {
    const next = jest.fn();
    (mockConfigService.get as jest.Mock).mockReturnValue('valid-key');
    const request = {
      headers: { 'x-api-key': 'valid-key' },
    } as unknown as Request;
    const response = {} as Response;

    middleware.use(request, response, next as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws when the API key is missing or invalid', () => {
    (mockConfigService.get as jest.Mock).mockReturnValue('valid-key');
    const request = {
      headers: {},
    } as unknown as Request;
    const response = {} as Response;

    expect(() =>
      middleware.use(request, response, jest.fn() as NextFunction),
    ).toThrow(UnauthorizedException);
  });
});
