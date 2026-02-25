import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { User } from '../database/entities/user.entity';
import { Content } from '../database/entities/content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Content])],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
