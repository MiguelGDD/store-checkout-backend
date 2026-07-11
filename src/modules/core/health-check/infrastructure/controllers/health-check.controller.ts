import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from '../services/health-check.service';

@Controller('health')
export class HealthCheckController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  check() {
    return this.healthCheckService.check();
  }
}
