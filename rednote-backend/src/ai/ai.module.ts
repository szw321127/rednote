import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LangchainService } from './services/langchain.service';
import { ImageService } from './services/image.service';

@Module({
  imports: [ConfigModule],
  providers: [LangchainService, ImageService],
  exports: [LangchainService, ImageService],
})
export class AiModule {}
