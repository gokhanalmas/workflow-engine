import { ApiProperty } from '@nestjs/swagger';

export class WorkflowResultDto {
  @ApiProperty({ example: true, description: 'Whether the workflow executed successfully' })
  success: boolean;

  @ApiProperty({ required: false, description: 'Error message if workflow failed' })
  error?: string;

  @ApiProperty({ 
    example: {
      'Login': { token: 'xyz' },
      'GetUsers': { users: [] }
    },
    description: 'Results from each workflow step'
  })
  stepResults: Record<string, any>;
}