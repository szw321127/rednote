import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Logger,
  Post,
  Res,
  Session,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
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
    @Res() res: Response,
    @Session() session: SessionData,
  ) {
    this.logger.log('Received outline generation request');

    try {
      // Always use model config and parameters from session
      const modelConfig = session.textModelConfig;
      const parameters = session.parameters;

      if (!modelConfig) {
        throw new BadRequestException(
          'Model configuration not found in session. Please configure your models in settings first.',
        );
      }

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const finalModelConfig: ModelConfig = {
        ...modelConfig,
        temperature: parameters?.temperature ?? modelConfig.temperature,
        topP: parameters?.topP ?? modelConfig.topP,
      };

      await this.generateService.generateOutlinesStream(
        dto.topic,
        finalModelConfig,
        (chunk: string) => {
          res.write(chunk);
        },
      );

      // Send final newline to ensure client knows stream is complete
      res.write('\n');
      res.end();

      this.logger.log('Outline generation completed');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate outlines: ${errorMessage}`);

      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to generate outlines',
          error: errorMessage,
        });
      } else {
        res.end();
      }
    }
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
