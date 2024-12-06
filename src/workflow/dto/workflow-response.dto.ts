import { ApiProperty } from '@nestjs/swagger';

export class WorkflowResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Workflow executed successfully' })
  message: string;

  @ApiProperty({ 
    example: {
      'GetData': { items: ['item1', 'item2'] },
      'ProcessData': { status: 'completed' }
    },
    description: 'Results from each workflow step'
  })
  stepResults?: Record<string, any>;

  @ApiProperty({ required: false })
  error?: string;
}