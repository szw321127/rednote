import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { AiModule } from '../ai/ai.module';
import { Content } from '../database/entities/content.entity';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [AiModule, TypeOrmModule.forFeature([Content, User])],
  controllers: [GenerateController],
  providers: [GenerateService],
})
export class GenerateModule {}
