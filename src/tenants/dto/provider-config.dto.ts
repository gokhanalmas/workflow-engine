import { ApiProperty } from '@nestjs/swagger';

export class ProviderConfigDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  providerName: string;

  @ApiProperty()
  apiUrl: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ required: false })
  additionalConfig?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}