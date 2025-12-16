import { Module } from '@nestjs/common';
import { ConfigStorageController } from './config-storage.controller';
import { ConfigStorageService } from './services/config-storage.service';

@Module({
  controllers: [ConfigStorageController],
  providers: [ConfigStorageService],
  exports: [ConfigStorageService],
})
export class ConfigStorageModule {}
