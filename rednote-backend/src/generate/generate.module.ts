import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { AiModule } from '../ai/ai.module';
import { Content } from '../database/entities/content.entity';
import { QuotaService } from './quota.service';

@Module({
  imports: [AiModule, TypeOrmModule.forFeature([Content])],
  controllers: [GenerateController],
  providers: [GenerateService, QuotaService],
})
export class GenerateModule {}
