import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class SaveConfigDto {
  @IsString()
  @IsOptional()
  fingerprint?: string;

  @IsObject()
  @IsNotEmpty()
  config: {
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
  };
}
