import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  Session,
  ValidationPipe,
} from '@nestjs/common';
import { ModelConfig } from '../common/interfaces/model-config.interface';
import { GenerateContentDto } from './dto/generate-content.dto';
import { GenerateOutlineDto } from './dto/generate-outline.dto';
import { GenerateService } from './generate.service';

interface SessionData {
  textModelConfig?: ModelConfig;
  imageModelConfig?: ModelConfig;
  parameters?: {
    temperature?: number;
    topP?: number;
  };
}

@Controller('api/generate')
export class GenerateController {
  private readonly logger = new Logger(GenerateController.name);

  constructor(private readonly generateService: GenerateService) {}

  @Post('outline')
  async generateOutline(
    @Body(ValidationPipe) dto: GenerateOutlineDto,
    @Session() session: SessionData,
  ) {
    this.logger.log('Received outline generation request');

    const modelConfig = session.textModelConfig;
    const parameters = session.parameters;

    if (!modelConfig) {
      throw new BadRequestException(
        'Model configuration not found in session. Please configure your models in settings first.',
      );
    }

    const finalModelConfig: ModelConfig = {
      ...modelConfig,
      temperature: parameters?.temperature ?? modelConfig.temperature,
      topP: parameters?.topP ?? modelConfig.topP,
    };

    const result = await this.generateService.generateOutlines(
      dto.topic,
      finalModelConfig,
    );

    this.logger.log('Outline generation completed');
    return result;
  }

  @Post('content')
  async generateContent(
    @Body(ValidationPipe) dto: GenerateContentDto,
    @Session() session: SessionData,
  ) {
    this.logger.log('Received content generation request');

    try {
      // Always use model configs from session
      const textModelConfig = session.textModelConfig;
      const imageModelConfig = session.imageModelConfig;

      if (!textModelConfig || !imageModelConfig) {
        throw new BadRequestException(
          'Model configuration not found in session. Please configure your models in settings first.',
        );
      }

      const result = await this.generateService.generateContent(
        dto.outline,
        textModelConfig,
        imageModelConfig,
      );

      this.logger.log('Content generation completed');

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate content: ${errorMessage}`);
      throw error;
    }
  }
}
