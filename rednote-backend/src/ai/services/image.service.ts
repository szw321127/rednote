import { GoogleGenAI, GoogleGenAIOptions } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelConfig } from '../../common/interfaces/model-config.interface';

interface DallEResponse {
  data?: Array<{
    url?: string;
  }>;
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(private configService: ConfigService) {}

  async generateImage(
    prompt: string,
    modelConfig: ModelConfig,
  ): Promise<string> {
    this.logger.log(`Generating image with model: ${modelConfig.modelName}`);

    const apiKey =
      modelConfig.apiKey || this.getApiKeyForProvider(modelConfig.provider);

    if (
      modelConfig.provider === 'openai' ||
      modelConfig.modelName.includes('dall-e')
    ) {
      return this.generateWithDallE(prompt, apiKey, modelConfig);
    } else {
      // Use fetch method by default (more reliable and flexible)
      return this.generateWithGemini(prompt, apiKey, modelConfig);
    }
  }

  private async generateWithDallE(
    prompt: string,
    apiKey: string,
    modelConfig: ModelConfig,
  ): Promise<string> {
    this.logger.log('Generating image with DALL-E');

    const baseUrl = modelConfig.baseUrl || 'https://api.openai.com';
    const path = modelConfig.path || '/v1/images/generations';
    const url = `${baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelConfig.modelName || 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`DALL-E API error: ${error}`);
        throw new Error(`DALL-E API error: ${response.statusText}`);
      }

      const data = (await response.json()) as DallEResponse;
      const imageUrl: string | undefined = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL in DALL-E response');
      }

      this.logger.log(`Generated image URL: ${imageUrl}`);
      return imageUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to generate image with DALL-E: ${errorMessage}`,
      );
      throw error;
    }
  }

  private async generateWithGeminiFetch(
    prompt: string,
    apiKey: string,
    modelConfig: ModelConfig,
  ): Promise<string> {
    this.logger.log('Generating image with Gemini using Fetch API');

    if (!apiKey) {
      throw new Error('Google API key is not configured');
    }

    try {
      const baseUrl =
        modelConfig.baseUrl || 'https://generativelanguage.googleapis.com';
      const modelName =
        modelConfig.modelName || 'gemini-2.5-flash-image-preview';

      // Use generateContent endpoint
      const path =
        modelConfig.path || `/v1beta/models/${modelName}:generateContent`;
      const url = `${baseUrl}${path}?key=${apiKey}`;

      this.logger.log(`Request URL: ${url}`);
      this.logger.log(`Prompt: ${prompt}`);

      const temperature = modelConfig.temperature ?? 0.7;
      const topP = modelConfig.topP ?? 0.95;

      this.logger.log(
        `Generation config - temperature: ${temperature}, topP: ${topP}`,
      );

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature,
          topP,
          candidateCount: 1,
        },
      };

      this.logger.log('Sending request to Gemini API via Fetch...');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000), // 2 minutes timeout
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Gemini API error: ${error}`);
        throw new Error(`Gemini API error: ${response.statusText} - ${error}`);
      }

      this.logger.log('Received response from Gemini API');

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              inlineData?: {
                data: string;
                mimeType: string;
              };
              text?: string;
            }>;
          };
        }>;
      };

      this.logger.log(`Response data: ${JSON.stringify(data, null, 2)}`);

      // Extract image data from response
      const candidates = data.candidates;

      if (!candidates || candidates.length === 0) {
        this.logger.error('No candidates in Gemini response');
        this.logger.error(`Full response: ${JSON.stringify(data)}`);
        throw new Error('No image data in Gemini response');
      }

      const parts = candidates[0]?.content?.parts;
      if (!parts || parts.length === 0) {
        this.logger.error('No parts in candidate');
        throw new Error('No content parts in response');
      }

      // Find the image part
      for (const part of parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';

          this.logger.log(
            `Successfully generated image with mime type: ${mimeType}`,
          );

          // Return as base64 data URL
          return `data:${mimeType};base64,${imageData}`;
        }
      }

      this.logger.error('No inline image data found in response');
      this.logger.error(`Parts: ${JSON.stringify(parts)}`);
      throw new Error('No image data found in Gemini response');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to generate image with Gemini Fetch: ${errorMessage}`,
      );

      // Log more details for network errors
      if (
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('aborted')
      ) {
        this.logger.error('Network/timeout error detected. Please check:');
        this.logger.error(
          '1. Network connection to generativelanguage.googleapis.com',
        );
        this.logger.error(
          '2. Google API key is valid and has Gemini API access',
        );
        this.logger.error(
          '3. Model name is correct and supports image generation',
        );
      }

      throw error;
    }
  }

  private async generateWithGemini(
    prompt: string,
    apiKey: string,
    modelConfig: ModelConfig,
  ): Promise<string> {
    this.logger.log('Generating image with Gemini using SDK');

    if (!apiKey) {
      throw new Error('Google API key is not configured');
    }

    try {
      // Initialize Google Gen AI SDK with optional baseUrl
      const sdkConfig: GoogleGenAIOptions = {
        apiKey,
      };

      if (modelConfig.baseUrl) {
        sdkConfig.httpOptions = {
          baseUrl: modelConfig.baseUrl,
        };
        this.logger.log(`Using custom baseUrl: ${modelConfig.baseUrl}`);
      }

      const ai = new GoogleGenAI(sdkConfig);

      // Use Gemini 2.5 Flash Image or Gemini 3 Pro Image for image generation
      // These models can generate realistic images with people, environments, animals
      const modelName =
        modelConfig.modelName || 'gemini-2.5-flash-image-preview';

      this.logger.log(`Using Gemini model: ${modelName}`);
      this.logger.log(`Prompt: ${prompt}`);

      // Prepare generation config with temperature and topP
      const temperature = modelConfig.temperature ?? 0.7;
      const topP = modelConfig.topP ?? 0.95;

      this.logger.log(
        `Generation config - temperature: ${temperature}, topP: ${topP}`,
      );

      // Generate image using the SDK with generation configuration
      this.logger.log('Sending request to Gemini API...');
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: temperature,
          topP: topP,
        },
      });

      this.logger.log('Received response from Gemini');

      // Extract image data from response
      const parts = response.candidates?.[0]?.content?.parts;

      if (!parts || parts.length === 0) {
        this.logger.error('No parts in Gemini response');
        this.logger.error(`Full response: ${JSON.stringify(response)}`);
        throw new Error('No image data in Gemini response');
      }

      // Find the image part
      for (const part of parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';

          this.logger.log(
            `Successfully generated image with mime type: ${mimeType}`,
          );

          // Return as base64 data URL
          return `data:${mimeType};base64,${imageData}`;
        }
      }

      this.logger.error('No inline image data found in response');
      this.logger.error(`Response parts: ${JSON.stringify(parts)}`);
      throw new Error('No image data found in Gemini response');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to generate image with Gemini SDK: ${errorMessage}`,
      );

      // Log more details for network errors
      if (errorMessage.includes('fetch failed')) {
        this.logger.error('Network error detected. Please check:');
        this.logger.error('1. Docker container can access external network');
        this.logger.error(
          '2. Google API key is valid and has image generation permissions',
        );
        this.logger.error(
          '3. No firewall blocking requests to generativelanguage.googleapis.com',
        );
      }

      throw error;
    }
  }

  private getApiKeyForProvider(provider?: string): string {
    if (provider === 'openai') {
      return this.configService.get<string>('OPENAI_API_KEY', '');
    }
    return this.configService.get<string>('GOOGLE_API_KEY', '');
  }
}
