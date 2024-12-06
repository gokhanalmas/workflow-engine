import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    example: 'Acme Corp',
    description: 'Name of the tenant organization'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'acme.com',
    description: 'Domain associated with the tenant'
  })
  @IsString()
  @IsNotEmpty()
  domain: string;

  @ApiProperty({
    example: 'https://api.acme.com',
    description: 'Base API URL for the tenant',
    required: false
  })
  @IsUrl()
  @IsOptional()
  apiUrl?: string;

  @ApiProperty({
    example: { apiKey: 'xyz123', region: 'us-east-1' },
    description: 'Additional configuration for the tenant',
    required: false
  })
  @IsOptional()
  config?: Record<string, any>;
}