import { IsString, IsNotEmpty } from 'class-validator';

export class GetConfigDto {
  @IsString()
  @IsNotEmpty()
  fingerprint: string;
}
