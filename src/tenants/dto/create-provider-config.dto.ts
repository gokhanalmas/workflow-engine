import { IsString, IsObject, IsOptional } from 'class-validator';

export class CreateProviderConfigDto {
  @IsString()
  providerName: string;

  @IsString()
  apiUrl: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsObject()
  @IsOptional()
  additionalConfig?: Record<string, any>;
}