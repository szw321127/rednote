import {
  Body,
  Controller,
  Logger,
  Post,
  Session,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SetModelConfigDto } from './dto/set-model-config.dto';
import type { ModelConfig } from '../common/interfaces/model-config.interface';

@Controller('api/session')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly configService: ConfigService) {}

  @Post('set-model-config')
  setModelConfig(
    @Body(ValidationPipe) dto: SetModelConfigDto,
    @Session() session: Record<string, any>,
  ) {
    this.logger.log('Setting model config in session');

    // Process model configs and fill in API keys from env if empty
    if (dto.textModelConfig) {
      session.textModelConfig = this.fillApiKey(dto.textModelConfig);
    }

    if (dto.imageModelConfig) {
      session.imageModelConfig = this.fillApiKey(dto.imageModelConfig);
    }

    session.parameters = dto.parameters;

    return {
      success: true,
      message: 'Model configuration saved to session',
    };
  }

  private fillApiKey(config: ModelConfig): ModelConfig {
    // If apiKey is empty or empty string, get from env
    if (!config.apiKey || config.apiKey.trim() === '') {
      const provider = config.provider?.toLowerCase();
      let envKey: string | undefined;

      switch (provider) {
        case 'google':
        case 'gemini':
          envKey = this.configService.get<string>('GOOGLE_API_KEY');
          break;
        case 'openai':
          envKey = this.configService.get<string>('OPENAI_API_KEY');
          break;
        default:
          this.logger.warn(
            `Unknown provider: ${provider}, cannot fill API key from env`,
          );
          break;
      }

      if (envKey) {
        this.logger.log(`Using API key from env for provider: ${provider}`);
        return { ...config, apiKey: envKey };
      }
    }

    return config;
  }
}
