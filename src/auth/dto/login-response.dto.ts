import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token for API authentication'
  })
  access_token: string;

  @ApiProperty({
    example: 'admin@example.com',
    description: 'Email of the authenticated user'
  })
  email: string;

  @ApiProperty({
    example: 'admin',
    description: 'Role of the authenticated user'
  })
  role: string;
}