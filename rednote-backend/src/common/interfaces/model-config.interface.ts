export interface ModelConfig {
  provider?: string;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
  path?: string;
  temperature?: number;
  topP?: number;
}
