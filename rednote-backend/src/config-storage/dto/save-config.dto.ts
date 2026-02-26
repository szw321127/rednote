import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ModelProvider } from '../../common/dto/model-config.dto';

class SavedModelDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsOptional()
  @IsEnum(ModelProvider)
  provider?: ModelProvider;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  path?: string;
}

class UserConfigPayloadDto {
  @IsOptional()
  @IsUrl({ require_tld: false })
  backendUrl?: string;

  @IsOptional()
  @IsString()
  activeTextModelId?: string;

  @IsOptional()
  @IsString()
  activeImageModelId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SavedModelDto)
  models?: SavedModelDto[];

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

export class SaveConfigDto {
  @IsString()
  @IsOptional()
  fingerprint?: string;

  @ValidateNested()
  @Type(() => UserConfigPayloadDto)
  @IsNotEmpty()
  config: UserConfigPayloadDto;
}
