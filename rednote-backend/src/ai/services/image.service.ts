import { GoogleGenAI, GoogleGenAIOptions } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelConfig } from '../../common/interfaces/model-config.interface';
import { redactSecrets, summarizeText } from '../../common/logging/redaction.util';
import { resolveAndValidateEndpoint } from '../../common/security/ai-endpoint-policy.util';

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

    const normalizedProvider = (modelConfig.provider || '').toLowerCase();
    const provider =
      normalizedProvider === 'gemini' ? 'google' : normalizedProvider;
    const apiKey = modelConfig.apiKey || this.getApiKeyForProvider(provider);

    if (provider === 'openai' || modelConfig.modelName.includes('dall-e')) {
      return this.generateWithDallE(prompt, apiKey, {
        ...modelConfig,
        provider: 'openai',
      });
    }

    // Use SDK method by default
    return this.generateWithGemini(prompt, apiKey, {
      ...modelConfig,
      provider: 'google',
    });
  }

  private async generateWithDallE(
    prompt: string,
    apiKey: string,
    modelConfig: ModelConfig,
  ): Promise<string> {
    this.logger.log('Generating image with DALL-E');

    const defaultPath = '/v1/images/generations';
    const endpoint = resolveAndValidateEndpoint(
      {
        ...modelConfig,
        provider: 'openai',
        path: modelConfig.path || defaultPath,
      },
      this.configService.get<string>('AI_BASE_URL_ALLOWLIST'),
    );

    const requestPath = endpoint.path || defaultPath;
    const url = `${endpoint.baseUrl}${requestPath}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelConfig.modelName || 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `DALL-E API error status=${response.status}, statusText=${response.statusText}, bodyLength=${errorBody.length}`,
        );
        throw new Error(`DALL-E API error: ${response.statusText}`);
      }

      const data = (await response.json()) as DallEResponse;
      const imageUrl: string | undefined = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL in DALL-E response');
      }

      return imageUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to generate image with DALL-E: ${summarizeText(redactSecrets(errorMessage), 220)}`,
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
      const modelName =
        modelConfig.modelName || 'gemini-2.5-flash-image-preview';
      const defaultPath = `/v1beta/models/${modelName}:generateContent`;
      const endpoint = resolveAndValidateEndpoint(
        {
          ...modelConfig,
          provider: 'google',
          path: modelConfig.path || defaultPath,
        },
        this.configService.get<string>('AI_BASE_URL_ALLOWLIST'),
      );

      const requestPath = endpoint.path || defaultPath;
      const url = `${endpoint.baseUrl}${requestPath}`;

      const temperature = modelConfig.temperature ?? 0.7;
      const topP = modelConfig.topP ?? 0.95;

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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Gemini API error status=${response.status}, statusText=${response.statusText}, bodyLength=${errorBody.length}`,
        );
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              inlineData?: {
                data: string;
                mimeType: string;
              };
            }>;
          };
        }>;
      };

      const parts = data.candidates?.[0]?.content?.parts;
      if (!parts || parts.length === 0) {
        throw new Error('No image data in Gemini response');
      }

      for (const part of parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${imageData}`;
        }
      }

      throw new Error('No image data found in Gemini response');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to generate image with Gemini Fetch: ${summarizeText(redactSecrets(errorMessage), 220)}`,
      );
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
      const endpoint = resolveAndValidateEndpoint(
        { ...modelConfig, provider: 'google' },
        this.configService.get<string>('AI_BASE_URL_ALLOWLIST'),
      );

      const sdkConfig: GoogleGenAIOptions = {
        apiKey,
        httpOptions: {
          baseUrl: endpoint.baseUrl,
        },
      };

      const ai = new GoogleGenAI(sdkConfig);
      const modelName =
        modelConfig.modelName || 'gemini-2.5-flash-image-preview';
      const temperature = modelConfig.temperature ?? 0.7;
      const topP = modelConfig.topP ?? 0.95;

      this.logger.debug(
        `Gemini generation config model=${modelName}, promptLength=${prompt.length}, temperature=${temperature}, topP=${topP}`,
      );

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature,
          topP,
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts || parts.length === 0) {
        throw new Error('No image data in Gemini response');
      }

      for (const part of parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${imageData}`;
        }
      }

      throw new Error('No image data found in Gemini response');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to generate image with Gemini SDK: ${summarizeText(redactSecrets(errorMessage), 220)}`,
      );
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
