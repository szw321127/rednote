import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LangchainService } from './services/langchain.service';
import { ImageService } from './services/image.service';
import { ContentQualityService } from './services/content-quality.service';

@Module({
  imports: [ConfigModule],
  providers: [LangchainService, ImageService, ContentQualityService],
  exports: [LangchainService, ImageService, ContentQualityService],
})
export class AiModule {}
