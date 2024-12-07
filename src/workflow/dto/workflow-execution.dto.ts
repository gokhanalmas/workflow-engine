// src/workflow/dto/workflow-execution.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { ExecutionStatus } from '../../enums/execution-status.enum';
import { IsString, IsEnum, IsDate, IsNumber, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowStepLogDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    executionId: string;

    @ApiProperty()
    @IsString()
    stepName: string;

    @ApiProperty({ enum: ExecutionStatus })
    @IsEnum(ExecutionStatus)
    status: ExecutionStatus;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    startedAt: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    completedAt?: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    durationMs?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    request?: {
        method: string;
        url: string;
        headers: Record<string, string>;
        body?: any;
    };

    @ApiProperty({ required: false })
    @IsOptional()
    response?: {
        status: number;
        headers: Record<string, string>;
        body: any;
    };

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    error?: string;
}

export class WorkflowExecutionLogDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    workflowId: string;

    @ApiProperty()
    @IsString()
    tenantId: string;

    @ApiProperty({ enum: ExecutionStatus })
    @IsEnum(ExecutionStatus)
    status: ExecutionStatus;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    startedAt: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    completedAt?: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    totalDurationMs?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    error?: string;

    @ApiProperty({ type: [WorkflowStepLogDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WorkflowStepLogDto)
    stepLogs: WorkflowStepLogDto[];
}