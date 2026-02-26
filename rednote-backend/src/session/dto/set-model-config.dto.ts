import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import {
  GenerateParametersDto,
  ModelConfigDto,
} from '../../common/dto/model-config.dto';

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
