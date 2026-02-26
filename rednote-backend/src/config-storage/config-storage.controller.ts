import {
  Controller,
  Post,
  Get,
  Body,
  HttpStatus,
  HttpException,
  Logger,
  ValidationPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConfigStorageService } from './services/config-storage.service';
import { SaveConfigDto } from './dto/save-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    sub: string;
  };
}

@Controller('api/config')
export class ConfigStorageController {
  private readonly logger = new Logger(ConfigStorageController.name);

  constructor(private readonly configStorageService: ConfigStorageService) {}

  @UseGuards(JwtAuthGuard)
  @Post('save')
  saveConfig(
    @Body(ValidationPipe) dto: SaveConfigDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    this.logger.log(`Received config save request for userId: ${userId}`);

    try {
      const savedConfig = this.configStorageService.saveConfig(userId, {
        ...dto.config,
        fingerprint: dto.fingerprint,
      });

      return {
        success: true,
        message: 'Configuration saved successfully',
        config: this.sanitizeConfig(savedConfig),
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

  @UseGuards(JwtAuthGuard)
  @Get('get')
  getConfig(@Request() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    this.logger.log(`Received config get request for userId: ${userId}`);

    const config = this.configStorageService.getConfig(userId);

    if (!config) {
      return {
        success: false,
        message: 'No configuration found for this user',
        config: null,
      };
    }

    return {
      success: true,
      message: 'Configuration retrieved successfully',
      config: this.sanitizeConfig(config),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  getStats() {
    const count = this.configStorageService.getConfigCount();

    return {
      totalConfigs: count,
      message: `Currently storing ${count} user configuration(s)`,
    };
  }

  private sanitizeConfig(config: unknown) {
    const cloned = JSON.parse(JSON.stringify(config)) as {
      models?: Array<Record<string, unknown>>;
    };

    if (Array.isArray(cloned.models)) {
      cloned.models = cloned.models.map((model) => {
        if ('apiKey' in model) {
          return {
            ...model,
            apiKey: undefined,
          };
        }
        return model;
      });
    }

    return cloned;
  }
}
