import { AppSettings, Outline, ModelConfig } from "../types";
import { authFetch, isLoggedIn } from "./auth";
import { parseJsonResponse } from "./http";

// Replaced GeminiService with generic ApiService
export class ApiService {
  private settings: AppSettings;

  constructor(settings: AppSettings) {
    this.settings = settings;
  }

  private getModelConfig(modelId: string): ModelConfig {
    const config = this.settings.models.find(m => m.id === modelId);
    if (!config) {
      throw new Error(`Model configuration not found for ID: ${modelId}`);
    }
    return config;
  }

  // Helper to construct full URL
  private getEndpoint(path: string): string {
    const base = this.settings.backendUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }

  private buildSessionModelConfig(model: ModelConfig, isImageModel = false): {
    provider: 'openai' | 'google';
    modelName: string;
    apiKey?: string;
  } {
    const isOpenAI = model.name.includes('gpt') || (isImageModel && model.name.includes('dall-e'));
    const config: {
      provider: 'openai' | 'google';
      modelName: string;
      apiKey?: string;
    } = {
      provider: isOpenAI ? 'openai' : 'google',
      modelName: model.name,
    };

    const apiKey = model.apiKey?.trim();
    if (apiKey) {
      config.apiKey = apiKey;
    }

    return config;
  }

  /**
   * Set model configuration in backend session
   */
  async setModelConfig(): Promise<boolean> {
    try {
      const textModel = this.getModelConfig(this.settings.activeTextModelId);
      const imageModel = this.getModelConfig(this.settings.activeImageModelId);

      const response = await fetch(this.getEndpoint('/api/session/set-model-config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: include credentials for session
        body: JSON.stringify({
          textModelConfig: this.buildSessionModelConfig(textModel),
          imageModelConfig: this.buildSessionModelConfig(imageModel, true),
          parameters: {
            temperature: this.settings.temperature,
            topP: this.settings.topP,
          }
        }),
      });

      const result = await parseJsonResponse<{ success: boolean }>(response);
      return !!result.success;
    } catch (e) {
      console.error("Failed to set model config:", e);
      return false;
    }
  }

  /**
   * Calls the backend to generate outlines.
   * Expects the backend to stream text (SSE or raw stream).
   */
  async generateOutlinesStream(topic: string, onChunk: (text: string) => void): Promise<Outline[]> {
    // No longer need to send modelConfig, it's in session
    const payload = {
      topic,
    };

    try {
      const response = await fetch(this.getEndpoint('/api/generate/outline'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: include credentials for session
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        onChunk(accumulatedText);
      }

      // Assume backend returns the final JSON array in the text stream, or we parse the final accumulated text
      // For robustness, we try to find the JSON array in the text
      try {
        // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
        let cleanedText = accumulatedText.trim();
        cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

        // Extract JSON array
        const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : cleanedText;
        const parsed = JSON.parse(jsonString);
        return parsed.map((item: any, index: number) => ({ ...item, id: `outline-${Date.now()}-${index}` }));
      } catch (e) {
        // Surface a friendly, retryable error instead of leaking "Unexpected end of JSON input"
        console.warn("Failed to parse JSON from stream", e);
        throw new Error('后端返回的大纲数据不完整（JSON解析失败），请重试。');
      }

    } catch (error) {
      console.error("Outline Generation Error:", error);
      throw error;
    }
  }

  /**
   * Calls the backend to generate image and caption.
   */
  async generateImageAndCaption(outline: Outline): Promise<{ imageUrl: string; caption: string }> {
    // No longer need to send modelConfig, it's in session
    const payload = {
      outline,
    };

    const response = await fetch(this.getEndpoint('/api/generate/content'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important: include credentials for session
      body: JSON.stringify(payload),
    });

    const result = await parseJsonResponse<{ imageUrl: string; caption: string }>(response);
    return {
        imageUrl: result.imageUrl,
        caption: result.caption
    };
  }
  
  /**
   * Pings the backend health check
   */
  async testConnection(modelConfig?: ModelConfig): Promise<boolean> {
    try {
        // If testing a specific model, we might send a test request to the backend
        // For now, we just check if the backend is reachable
        const response = await fetch(this.getEndpoint('/api/health'), {
            method: 'GET'
        });
        return response.ok;
    } catch (e) {
        console.error("Connection test failed:", e);
        return false;
    }
  }

  /**
   * Save user configuration to backend
   */
  async saveConfig(config: Partial<AppSettings>): Promise<boolean> {
    if (!isLoggedIn()) {
      console.warn('saveConfig skipped: user is not logged in');
      return false;
    }

    try {
      const sanitizedModels = config.models?.map(({ apiKey, baseUrl, path, ...rest }) => rest);

      const response = await authFetch(this.getEndpoint('/api/config/save'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            backendUrl: config.backendUrl,
            activeTextModelId: config.activeTextModelId,
            activeImageModelId: config.activeImageModelId,
            models: sanitizedModels,
            temperature: config.temperature,
            topP: config.topP,
          }
        }),
      });

      const result = await parseJsonResponse<{ success: boolean }>(response);
      return !!result.success;
    } catch (e) {
      console.error("Failed to save config:", e);
      return false;
    }
  }

  /**
   * Get user configuration from backend
   */
  async getConfig(): Promise<any | null> {
    if (!isLoggedIn()) {
      console.warn('getConfig skipped: user is not logged in');
      return null;
    }

    try {
      const response = await authFetch(this.getEndpoint('/api/config/get'), {
        method: 'GET',
      });

      const result = await parseJsonResponse<{ success: boolean; config?: any }>(response);
      return result.success ? (result.config ?? null) : null;
    } catch (e) {
      console.error("Failed to get config:", e);
      return null;
    }
  }
}
