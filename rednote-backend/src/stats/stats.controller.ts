import {
  Controller,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getUserStats(@Request() req: any) {
    return this.statsService.getUserStats(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  getAdminStats() {
    return this.statsService.getAdminStats();
  }
}
