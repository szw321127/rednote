import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum ModelProvider {
  GOOGLE = 'google',
  GEMINI = 'gemini',
  OPENAI = 'openai',
}

export class ModelConfigDto {
  @IsEnum(ModelProvider)
  provider: ModelProvider;

  @IsString()
  @IsNotEmpty()
  modelName: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  topP?: number;
}

export class GenerateParametersDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  topP?: number;
}
