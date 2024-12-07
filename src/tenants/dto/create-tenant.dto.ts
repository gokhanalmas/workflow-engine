// create-tenant.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

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
    example: 'psg_123456789',
    description: 'Passage API key for authentication'
  })
  @IsString()
  @IsNotEmpty()
  passageApiKey: string;
}