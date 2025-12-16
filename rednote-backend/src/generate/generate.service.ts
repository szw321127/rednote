import { Injectable, Logger } from '@nestjs/common';
import { LangchainService } from '../ai/services/langchain.service';
import { ImageService } from '../ai/services/image.service';
import { Outline } from '../common/interfaces/outline.interface';
import { ModelConfig } from '../common/interfaces/model-config.interface';

@Injectable()
export class GenerateService {
  private readonly logger = new Logger(GenerateService.name);

  constructor(
    private readonly langchainService: LangchainService,
    private readonly imageService: ImageService,
  ) {}

  async generateOutlines(
    topic: string,
    modelConfig: ModelConfig,
  ): Promise<Outline[]> {
    this.logger.log(`Generating outlines for topic: ${topic}`);
    return this.langchainService.generateOutlines(topic, modelConfig);
  }

  async generateOutlinesStream(
    topic: string,
    modelConfig: ModelConfig,
    onChunk: (chunk: string) => void,
  ): Promise<Outline[]> {
    this.logger.log(`Generating outlines (streaming) for topic: ${topic}`);
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
  ): Promise<{ imageUrl: string; caption: string }> {
    this.logger.log(`Generating content for outline: ${outline.title}`);

    // Generate caption
    const caption = await this.langchainService.generateCaption(
      outline,
      textModelConfig,
    );

    // Generate image prompt
    const imagePrompt = await this.langchainService.generateImagePrompt(
      outline,
      textModelConfig,
    );

    // Generate image
    const imageUrl = await this.imageService.generateImage(
      imagePrompt,
      imageModelConfig,
    );

    return {
      imageUrl,
      caption,
    };
  }
}
