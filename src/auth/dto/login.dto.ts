import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Email address for login'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Admin123!',
    description: 'Password for login',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  password: string;
}