import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  Session,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ModelConfig } from '../common/interfaces/model-config.interface';
import { GenerateContentDto } from './dto/generate-content.dto';
import { GenerateOutlineDto } from './dto/generate-outline.dto';
import { GenerateService } from './generate.service';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from '../database/entities/content.entity';
import { User } from '../database/entities/user.entity';
import { redactSecrets, summarizeText } from '../common/logging/redaction.util';

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

  constructor(
    private readonly generateService: GenerateService,
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Post('outline')
  @UseGuards(OptionalJwtGuard)
  async generateOutline(
    @Body(ValidationPipe) dto: GenerateOutlineDto,
    @Session() session: SessionData,
    @Request() req: any,
  ) {
    this.logger.log('Received outline generation request');

    const modelConfig = session.textModelConfig;
    const parameters = session.parameters;

    if (!modelConfig) {
      throw new BadRequestException(
        'Model configuration not found in session. Please configure your models in settings first.',
      );
    }

    // Check quota if user is authenticated
    if (req.user?.sub) {
      await this.checkAndDeductQuota(req.user.sub);
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

    // Persist content if user is authenticated
    if (req.user?.sub) {
      await this.contentRepo.save({
        userId: req.user.sub,
        topic: dto.topic,
        status: 'outline',
        outlines: result.map((o: any) => ({
          title: o.title,
          content: o.content,
          emoji: o.emoji,
          tags: o.tags,
        })),
        textModel: modelConfig.modelName,
      });
    }

    this.logger.log('Outline generation completed');
    return result;
  }

  @Post('content')
  @UseGuards(OptionalJwtGuard)
  async generateContent(
    @Body(ValidationPipe) dto: GenerateContentDto,
    @Session() session: SessionData,
    @Request() req: any,
  ) {
    this.logger.log('Received content generation request');

    try {
      const textModelConfig = session.textModelConfig;
      const imageModelConfig = session.imageModelConfig;

      if (!textModelConfig || !imageModelConfig) {
        throw new BadRequestException(
          'Model configuration not found in session. Please configure your models in settings first.',
        );
      }

      if (req.user?.sub) {
        await this.checkAndDeductQuota(req.user.sub);
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
      this.logger.error(
        `Failed to generate content: ${summarizeText(redactSecrets(errorMessage), 200)}`,
      );
      throw error;
    }
  }

  private async checkAndDeductQuota(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    // Reset quota if needed
    if (user.quotaResetAt && new Date() >= user.quotaResetAt) {
      user.quotaUsed = 0;
      user.quotaResetAt = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        1,
      );
    }

    if (user.quotaUsed >= user.quotaLimit) {
      throw new BadRequestException(
        `Monthly quota exceeded (${user.quotaLimit}). Please upgrade your plan.`,
      );
    }

    user.quotaUsed += 1;
    await this.userRepo.save(user);
  }
}
