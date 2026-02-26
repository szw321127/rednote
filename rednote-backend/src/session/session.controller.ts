import {
  BadRequestException,
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
import { resolveAndValidateEndpoint } from '../common/security/ai-endpoint-policy.util';

@Controller('api/session')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private readonly configService: ConfigService) {}

  @Post('set-model-config')
  setModelConfig(
    @Body(ValidationPipe) dto: SetModelConfigDto,
    @Session() session: Record<string, unknown>,
  ) {
    this.logger.log('Setting model config in session');

    // Process model configs and fill in API keys from env if empty
    if (dto.textModelConfig) {
      this.rejectCustomEndpointOverride(dto.textModelConfig);
      const normalizedConfig = this.normalizeAndValidateConfig(
        dto.textModelConfig,
      );
      session.textModelConfig = this.fillApiKey(normalizedConfig);
    }

    if (dto.imageModelConfig) {
      this.rejectCustomEndpointOverride(dto.imageModelConfig);
      const normalizedConfig = this.normalizeAndValidateConfig(
        dto.imageModelConfig,
      );
      session.imageModelConfig = this.fillApiKey(normalizedConfig);
    }

    session.parameters = dto.parameters;

    return {
      success: true,
      message: 'Model configuration saved to session',
    };
  }

  private rejectCustomEndpointOverride(config: ModelConfig): void {
    if (config.baseUrl || config.path) {
      throw new BadRequestException(
        'Custom baseUrl/path overrides are no longer allowed for security reasons.',
      );
    }
  }

  private normalizeAndValidateConfig(config: ModelConfig): ModelConfig {
    const endpoint = resolveAndValidateEndpoint(
      config,
      this.configService.get<string>('AI_BASE_URL_ALLOWLIST'),
    );

    return {
      ...config,
      provider: endpoint.provider,
      baseUrl: endpoint.baseUrl,
      path: endpoint.path,
    };
  }

  private fillApiKey(config: ModelConfig): ModelConfig {
    const endpoint = resolveAndValidateEndpoint(
      config,
      this.configService.get<string>('AI_BASE_URL_ALLOWLIST'),
    );

    // If apiKey is empty or empty string, get from env.
    // Env key autofill is only allowed for trusted allowlisted endpoints.
    if (
      (!config.apiKey || config.apiKey.trim() === '') &&
      endpoint.envKeyAutofillAllowed
    ) {
      const provider = endpoint.provider;
      let envKey: string | undefined;

      switch (provider) {
        case 'google':
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

    if (!config.apiKey && endpoint.trusted && !endpoint.envKeyAutofillAllowed) {
      this.logger.warn(
        `Skipping env API key autofill for non-default trusted host: ${endpoint.hostname}`,
      );
    }

    return config;
  }
}
