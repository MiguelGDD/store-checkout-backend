import { HealthCheckService } from './health-check.service';

describe('HealthCheckService', () => {
  it('returns a healthy response', () => {
    const service = new HealthCheckService();

    const result = service.check();

    expect(result.status).toBe('ok');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });
});
