import { Controller, Post, Body, Get, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { WorkflowResponseDto } from './dto/workflow-response.dto';
import { WorkflowEntity } from './entities/workflow.entity';

@ApiTags('Workflows')
@ApiBearerAuth()
@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workflow' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Workflow created successfully',
    type: WorkflowEntity 
  })
  async createWorkflow(@Body() createWorkflowDto: CreateWorkflowDto): Promise<WorkflowEntity> {
    return this.workflowService.createWorkflow(createWorkflowDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workflows' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all workflows',
    type: [WorkflowEntity]
  })
  async getWorkflows(): Promise<WorkflowEntity[]> {
    return this.workflowService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow details',
    type: WorkflowEntity
  })
  async getWorkflow(@Param('id') id: string): Promise<WorkflowEntity> {
    return this.workflowService.findOne(id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute a workflow' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow execution result',
    type: WorkflowResponseDto
  })
  async executeWorkflow(@Param('id') id: string): Promise<WorkflowResponseDto> {
    await this.workflowService.executeWorkflow(id);
    return {
      success: true,
      message: 'Workflow executed successfully',
      stepResults: {}
    };
  }
}