import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsObject, IsOptional, IsArray } from 'class-validator';
import { HttpMethod } from '../interfaces/workflow.interface';
import { RetryConfigDto } from './create-workflow.dto';

export class UpdateWorkflowStepDto {
  @ApiProperty({ example: 'GetUsers' })
  @IsString()
  stepName: string;

  @ApiProperty({ enum: HttpMethod, example: 'GET' })
  @IsEnum(HttpMethod)
  method: HttpMethod;

  @ApiProperty({ example: 'https://api.example.com/users' })
  @IsString()
  url: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  body?: any;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  output?: Record<string, string>;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional()
  dependsOn?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  retryConfig?: RetryConfigDto;
}