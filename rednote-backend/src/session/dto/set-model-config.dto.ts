import { IsObject, IsOptional } from 'class-validator';
import type { ModelConfig } from '../../common/interfaces/model-config.interface';

export class SetModelConfigDto {
  @IsObject()
  @IsOptional()
  textModelConfig?: ModelConfig;

  @IsObject()
  @IsOptional()
  imageModelConfig?: ModelConfig;

  @IsObject()
  @IsOptional()
  parameters?: {
    temperature?: number;
    topP?: number;
  };
}
