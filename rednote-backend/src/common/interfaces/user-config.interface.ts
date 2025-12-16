export interface UserConfig {
  fingerprint: string;
  backendUrl?: string;
  activeTextModelId?: string;
  activeImageModelId?: string;
  models?: Array<{
    id: string;
    name: string;
    displayName: string;
    apiKey?: string;
    baseUrl?: string;
    path?: string;
  }>;
  temperature?: number;
  topP?: number;
  updatedAt: Date;
}
