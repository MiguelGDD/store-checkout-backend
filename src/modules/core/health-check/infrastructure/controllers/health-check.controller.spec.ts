import { HealthCheckController } from './health-check.controller';
import { HealthCheckService } from '../services/health-check.service';

describe('HealthCheckController', () => {
  it('returns the health check response', () => {
    const service: Pick<HealthCheckService, 'check'> = {
      check: jest.fn().mockReturnValue({ status: 'ok', timestamp: 'now' }),
    };
    const controller = new HealthCheckController(service as HealthCheckService);

    expect(controller.check()).toEqual({ status: 'ok', timestamp: 'now' });
    expect(service.check).toHaveBeenCalledTimes(1);
  });
});
