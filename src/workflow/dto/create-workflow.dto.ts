import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsObject,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsUrl,
  ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { HttpMethod } from '../interfaces/workflow.interface';

export class RetryConfigDto {
  @ApiProperty({
    example: 3,
    description: 'Maximum number of retry attempts',
    minimum: 1,
    maximum: 10
  })
  @IsNumber({}, { message: 'Maximum attempts must be a number' })
  @Min(1, { message: 'Maximum attempts must be at least 1' })
  @Max(10, { message: 'Maximum attempts cannot exceed 10' })
  maxAttempts: number;

  @ApiProperty({
    example: 1000,
    description: 'Delay in milliseconds between retries',
    minimum: 100,
    maximum: 30000
  })
  @IsNumber({}, { message: 'Delay must be a number in milliseconds' })
  @Min(100, { message: 'Delay must be at least 100ms' })
  @Max(30000, { message: 'Delay cannot exceed 30 seconds (30000ms)' })
  delayMs: number;
}

export class WorkflowStepDto {
  @ApiProperty({
    example: 'GetUserData',
    description: 'Unique name for the workflow step',
    minLength: 3,
    maxLength: 50
  })
  @IsString({ message: 'Step name must be a text string' })
  @IsNotEmpty({ message: 'Step name cannot be empty' })
  @MinLength(3, { message: 'Step name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Step name cannot exceed 50 characters' })
  stepName: string;

  @ApiProperty({
    enum: HttpMethod,
    example: HttpMethod.GET,
    description: 'HTTP method for the API request'
  })
  @IsEnum(HttpMethod, {
    message: 'Invalid HTTP method. Must be one of: GET, POST, PUT, DELETE, or PATCH'
  })
  method: HttpMethod;

  @ApiProperty({
    example: 'https://api.example.com/users',
    description: 'Full URL for the API endpoint'
  })
  @IsString({ message: 'URL must be a text string' })
  @IsUrl({}, { message: 'Must be a valid URL starting with http:// or https://' })
  url: string;

  @ApiProperty({
    required: false,
    example: { 'Content-Type': 'application/json' },
    description: 'HTTP headers to include with the request'
  })
  @IsObject({ message: 'Headers must be an object of key-value pairs' })
  @IsOptional()
  headers?: Record<string, string>;

  @ApiProperty({
    required: false,
    example: { userId: 123 },
    description: 'Request body data'
  })
  @IsObject({ message: 'Body must be a valid JSON object' })
  @IsOptional()
  body?: any;

  @ApiProperty({
    required: false,
    example: { userData: '$.data.user' },
    description: 'Output mapping using JSONPath syntax'
  })
  @IsObject({ message: 'Output mapping must be an object' })
  @IsOptional()
  output?: Record<string, string>;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['Login', 'ValidateUser'],
    description: 'Names of steps that must complete before this step'
  })
  @IsArray({ message: 'Dependencies must be an array of step names' })
  @IsString({ each: true, message: 'Each dependency must be a step name string' })
  @IsOptional()
  dependsOn?: string[];

  @ApiProperty({
    required: false,
    type: RetryConfigDto,
    description: 'Configuration for automatic retry attempts'
  })
  @ValidateNested()
  @Type(() => RetryConfigDto)
  @IsOptional()
  retryConfig?: RetryConfigDto;
}

export class CreateWorkflowDto {
  @ApiProperty({
    example: 'UserSynchronization',
    description: 'Name of the workflow',
    minLength: 3,
    maxLength: 100
  })
  @IsString({ message: 'Workflow name must be a text string' })
  @IsNotEmpty({ message: 'Workflow name cannot be empty' })
  @MinLength(3, { message: 'Workflow name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Workflow name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the tenant this workflow belongs to'
  })
  @IsString({ message: 'Tenant ID must be a string' })
  @IsUUID('4', { message: 'Tenant ID must be a valid UUID v4' })
  tenantId: string;

  @ApiProperty({
    type: [WorkflowStepDto],
    description: 'Array of workflow steps to execute'
  })
  @IsArray({ message: 'Steps must be an array' })
  @ArrayMinSize(1, { message: 'Workflow must contain at least one step' })
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];
}