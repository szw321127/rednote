import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  GenerateParametersDto,
  ModelConfigDto,
} from '../../common/dto/model-config.dto';

export class GenerateOutlineDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ValidateNested()
  @Type(() => ModelConfigDto)
  @IsOptional()
  modelConfig?: ModelConfigDto;

  @ValidateNested()
  @Type(() => GenerateParametersDto)
  @IsOptional()
  parameters?: GenerateParametersDto;
}
