import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpStatus,
  HttpException,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigStorageService } from './services/config-storage.service';
import { SaveConfigDto } from './dto/save-config.dto';

@Controller('api/config')
export class ConfigStorageController {
  private readonly logger = new Logger(ConfigStorageController.name);

  constructor(private readonly configStorageService: ConfigStorageService) {}

  @Post('save')
  saveConfig(@Body(ValidationPipe) dto: SaveConfigDto) {
    this.logger.log(
      `Received config save request for fingerprint: ${dto.fingerprint.substring(0, 10)}...`,
    );

    try {
      const savedConfig = this.configStorageService.saveConfig(
        dto.fingerprint,
        dto.config,
      );

      return {
        success: true,
        message: 'Configuration saved successfully',
        config: savedConfig,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to save config: ${errorMessage}`);
      throw new HttpException(
        'Failed to save configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get')
  getConfig(@Query('fingerprint') fingerprint: string) {
    if (!fingerprint) {
      throw new HttpException(
        'Fingerprint is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(
      `Received config get request for fingerprint: ${fingerprint.substring(0, 10)}...`,
    );

    const config = this.configStorageService.getConfig(fingerprint);

    if (!config) {
      return {
        success: false,
        message: 'No configuration found for this fingerprint',
        config: null,
      };
    }

    return {
      success: true,
      message: 'Configuration retrieved successfully',
      config,
    };
  }

  @Get('stats')
  getStats() {
    const count = this.configStorageService.getConfigCount();

    return {
      totalConfigs: count,
      message: `Currently storing ${count} user configuration(s)`,
    };
  }
}
