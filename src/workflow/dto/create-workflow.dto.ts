import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsObject, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { HttpMethod, WorkflowStep, RetryConfig } from '../interfaces/workflow.interface';

export class RetryConfigDto implements RetryConfig {
  @ApiProperty({ example: 3 })
  maxAttempts: number;

  @ApiProperty({ example: 1000 })
  delayMs: number;
}

export class WorkflowStepDto implements WorkflowStep {
  @ApiProperty({ example: 'Login' })
  @IsString()
  stepName: string;

  @ApiProperty({ enum: HttpMethod, example: 'POST' })
  @IsEnum(HttpMethod)
  method: HttpMethod;

  @ApiProperty({ example: 'http://api.example.com/login' })
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
  @ValidateNested()
  @IsOptional()
  @Type(() => RetryConfigDto)
  retryConfig?: RetryConfigDto;
}

export class CreateWorkflowDto {
  @ApiProperty({ example: 'UserSync' })
  @IsString()
  name: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  @IsString()
  tenantId: string;

  @ApiProperty({ type: [WorkflowStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];
}