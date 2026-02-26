import { Injectable, Logger } from '@nestjs/common';
import { LangchainService } from '../ai/services/langchain.service';
import { ImageService } from '../ai/services/image.service';
import { ContentQualityService } from '../ai/services/content-quality.service';
import { Outline } from '../common/interfaces/outline.interface';
import { ModelConfig } from '../common/interfaces/model-config.interface';
import { redactSecrets, summarizeText } from '../common/logging/redaction.util';

@Injectable()
export class GenerateService {
  private readonly logger = new Logger(GenerateService.name);

  constructor(
    private readonly langchainService: LangchainService,
    private readonly imageService: ImageService,
    private readonly qualityService: ContentQualityService,
  ) {}

  async generateOutlines(
    topic: string,
    modelConfig: ModelConfig,
  ): Promise<Outline[]> {
    this.logger.log(`Generating outlines, topicLength=${topic.length}`);
    return this.langchainService.generateOutlines(topic, modelConfig);
  }

  async generateOutlinesStream(
    topic: string,
    modelConfig: ModelConfig,
    onChunk: (chunk: string) => void,
  ): Promise<Outline[]> {
    this.logger.log(`Generating outlines stream, topicLength=${topic.length}`);
    return this.langchainService.generateOutlinesStream(
      topic,
      modelConfig,
      onChunk,
    );
  }

  async generateContent(
    outline: Outline,
    textModelConfig: ModelConfig,
    imageModelConfig: ModelConfig,
  ): Promise<{
    imageUrl: string;
    caption: string;
    qualityScore?: {
      overall: number;
      creativity: number;
      engagement: number;
      clarity: number;
      suggestions: string[];
    };
  }> {
    this.logger.log(
      `Generating content, titleLength=${outline.title.length}, tagsCount=${outline.tags.length}`,
    );

    // Generate caption and image prompt in parallel
    const [caption, imagePrompt] = await Promise.all([
      this.langchainService.generateCaption(outline, textModelConfig),
      this.langchainService.generateImagePrompt(outline, textModelConfig),
    ]);

    // Generate image
    const imageUrl = await this.imageService.generateImage(
      imagePrompt,
      imageModelConfig,
    );

    // Evaluate quality asynchronously (don't block response)
    let qualityScore;
    try {
      qualityScore = await this.qualityService.evaluateCaption(caption);
    } catch (error) {
      this.logger.warn(
        `Quality evaluation skipped: ${summarizeText(redactSecrets(error), 180)}`,
      );
    }

    return {
      imageUrl,
      caption,
      qualityScore,
    };
  }
}
