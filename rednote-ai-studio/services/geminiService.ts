import { AppSettings, Outline, ModelConfig } from "../types";

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
          textModelConfig: {
            provider: textModel.name.includes('gpt') ? 'openai' : 'google',
            modelName: textModel.name,
            apiKey: textModel.apiKey || process.env.API_KEY,
            baseUrl: textModel.baseUrl,
            path: textModel.path,
          },
          imageModelConfig: {
            provider: imageModel.name.includes('gpt') || imageModel.name.includes('dall-e') ? 'openai' : 'google',
            modelName: imageModel.name,
            apiKey: imageModel.apiKey || process.env.API_KEY,
            baseUrl: imageModel.baseUrl,
            path: imageModel.path,
          },
          parameters: {
            temperature: this.settings.temperature,
            topP: this.settings.topP,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to set model config: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
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
        // Simple extraction logic, backend should ideally return pure JSON or SSE events
        const jsonMatch = accumulatedText.match(/\[.*\]/s);
        const jsonString = jsonMatch ? jsonMatch[0] : accumulatedText;
        const parsed = JSON.parse(jsonString);
        return parsed.map((item: any, index: number) => ({ ...item, id: `outline-${Date.now()}-${index}` }));
      } catch (e) {
        console.warn("Failed to parse JSON from stream, returning raw text as one item if possible", e);
        return [];
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

    if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
    }

    const result = await response.json();
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
  async saveConfig(fingerprint: string, config: Partial<AppSettings>): Promise<boolean> {
    try {
      const response = await fetch(this.getEndpoint('/api/config/save'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          config: {
            backendUrl: config.backendUrl,
            activeTextModelId: config.activeTextModelId,
            activeImageModelId: config.activeImageModelId,
            models: config.models,
            temperature: config.temperature,
            topP: config.topP,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save config: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (e) {
      console.error("Failed to save config:", e);
      return false;
    }
  }

  /**
   * Get user configuration from backend
   */
  async getConfig(fingerprint: string): Promise<any | null> {
    try {
      const response = await fetch(
        this.getEndpoint(`/api/config/get?fingerprint=${encodeURIComponent(fingerprint)}`),
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get config: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.config : null;
    } catch (e) {
      console.error("Failed to get config:", e);
      return null;
    }
  }
}
