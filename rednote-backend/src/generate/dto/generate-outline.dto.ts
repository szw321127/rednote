import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import type { ModelConfig } from '../../common/interfaces/model-config.interface';

export class GenerateOutlineDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsObject()
  @IsOptional()
  modelConfig?: ModelConfig;

  @IsObject()
  @IsOptional()
  parameters?: {
    temperature?: number;
    topP?: number;
  };
}
