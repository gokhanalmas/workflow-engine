import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional } from 'class-validator';
import { WorkflowDefinition } from '../interfaces/workflow.interface';

export class UpdateWorkflowDto {
  @ApiProperty({ 
    example: 'Updated Workflow Name',
    description: 'New name for the workflow',
    required: false 
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ 
    description: 'Updated workflow definition',
    required: false,
    type: 'object'
  })
  @IsObject()
  @IsOptional()
  definition?: Partial<WorkflowDefinition>;
}