import { ApiProperty } from '@nestjs/swagger';

export class WorkflowStepTestResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'GetUsers' })
  stepName: string;

  @ApiProperty({
    example: {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json'
      },
      data: { users: [] },
      request: {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {
          'Authorization': 'Bearer token123'
        },
        body: null
      }
    },
    description: 'Complete response details including request info'
  })
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    error?: string;
    request: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body: any;
    };
  };
}