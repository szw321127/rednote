export interface ModelConfig {
  id: string;
  name: string; // The actual model ID sent to API (e.g., gpt-4, gemini-2.5-flash)
  displayName: string; // User-friendly label
  apiKey?: string;
  baseUrl?: string; // Standard Base URL for LLM providers (e.g., https://api.openai.com)
  path?: string; // Specific API endpoint path (e.g., /v1/chat/completions)
}

export interface Outline {
  id: string;
  title: string;
  content: string;
  emoji: string;
  tags: string[];
}

export type PostStatus = 'outline' | 'completed';

export interface GeneratedPost {
  id: string;
  topic: string;
  status: PostStatus; // 'outline' for 大纲阶段, 'completed' for 成品阶段
  outlines: Outline[]; // 所有生成的大纲
  selectedOutline?: Outline; // 选中的大纲
  imageUrl?: string; // 图片URL（成品阶段才有）
  fullCaption?: string; // 文案（成品阶段才有）
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  backendUrl: string; // The URL of your NestJS backend
  activeTextModelId: string;
  activeImageModelId: string;
  models: ModelConfig[];
  temperature: number;
  topP: number;
}

export type ViewState = 'generator' | 'history' | 'settings';

export const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: 'default-gemini',
    name: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
  },
  {
    id: 'default-gpt4',
    name: 'gpt-4o',
    displayName: 'GPT-4o (OpenAI)',
    path: '/v1/chat/completions'
  },
  {
    id: 'default-image',
    name: 'gemini-2.5-flash-image',
    displayName: 'Gemini 2.5 Flash Image',
  },
  {
    id: 'default-dalle',
    name: 'dall-e-3',
    displayName: 'DALL-E 3',
    path: '/v1/images/generations'
  },
  {
    id: 'default-nano',
    name: 'gemini-3-pro-image-preview',
    displayName: 'Gemini 3 Pro Image Preview (Nano banana pro)',
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  backendUrl: '',
  activeTextModelId: 'default-gemini',
  activeImageModelId: 'default-image',
  models: DEFAULT_MODELS,
  temperature: 0.7,
  topP: 0.95,
};
