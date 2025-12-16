import { IsObject, IsNotEmpty, IsOptional } from 'class-validator';
import type { ModelConfig } from '../../common/interfaces/model-config.interface';
import type { Outline } from '../../common/interfaces/outline.interface';

export class GenerateContentDto {
  @IsObject()
  @IsNotEmpty()
  outline: Outline;

  @IsObject()
  @IsOptional()
  textModelConfig?: ModelConfig;

  @IsObject()
  @IsOptional()
  imageModelConfig?: ModelConfig;
}
