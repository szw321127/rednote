import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ModelConfigDto } from '../../common/dto/model-config.dto';

class OutlineDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tags: string[];
}

export class GenerateContentDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => OutlineDto)
  outline: OutlineDto;

  @ValidateNested()
  @Type(() => ModelConfigDto)
  @IsOptional()
  textModelConfig?: ModelConfigDto;

  @ValidateNested()
  @Type(() => ModelConfigDto)
  @IsOptional()
  imageModelConfig?: ModelConfigDto;
}
