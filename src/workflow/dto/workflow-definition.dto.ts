import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsEnum, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { HttpMethod } from '../interfaces/workflow.interface';

export class RetryConfigDto {
  @ApiProperty({ example: 3, description: 'Maximum number of retry attempts' })
  maxAttempts: number;

  @ApiProperty({ example: 1000, description: 'Delay in milliseconds between retries' })
  delayMs: number;
}

export class WorkflowStepDto {
  @ApiProperty({ example: 'GetUsers', description: 'Name of the workflow step' })
  @IsString()
  stepName: string;

  @ApiProperty({ 
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    example: 'POST',
    description: 'HTTP method for the request'
  })
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
  method: HttpMethod;

  @ApiProperty({ 
    example: 'https://api.provider.com/users',
    description: 'URL for the request' 
  })
  @IsString()
  url: string;

  @ApiProperty({ 
    example: { 'Content-Type': 'application/json' },
    description: 'Request headers',
    required: false
  })
  @IsOptional()
  headers?: Record<string, string>;

  @ApiProperty({ 
    example: { username: '{{tenant.username}}' },
    description: 'Request body',
    required: false
  })
  @IsOptional()
  body?: any;

  @ApiProperty({ 
    example: { token: '$.token' },
    description: 'Output mapping configuration',
    required: false
  })
  @IsOptional()
  output?: Record<string, string>;

  @ApiProperty({ 
    example: ['Login'],
    description: 'Steps that must be completed before this step',
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependsOn?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryConfigDto)
  retryConfig?: RetryConfigDto;
}

export class WorkflowDefinitionDto {
  @ApiProperty({ example: 'UserSync', description: 'Name of the workflow' })
  @IsString()
  workflowName: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID of the tenant' })
  @IsString()
  tenantId: string;

  @ApiProperty({ 
    type: [WorkflowStepDto],
    description: 'Array of workflow steps to execute'
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];
}