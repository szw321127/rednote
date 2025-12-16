import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class HealthController {
  @Get('health')
  checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'rednote-backend',
    };
  }
}
