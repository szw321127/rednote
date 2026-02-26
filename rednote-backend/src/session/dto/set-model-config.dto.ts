import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class ModelConfigDto {
  @IsIn(['google', 'gemini', 'openai'])
  provider: string;

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

class GenerateParametersDto {
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

export class SetModelConfigDto {
  @ValidateNested()
  @Type(() => ModelConfigDto)
  @IsOptional()
  textModelConfig?: ModelConfigDto;

  @ValidateNested()
  @Type(() => ModelConfigDto)
  @IsOptional()
  imageModelConfig?: ModelConfigDto;

  @ValidateNested()
  @Type(() => GenerateParametersDto)
  @IsOptional()
  parameters?: GenerateParametersDto;
}
