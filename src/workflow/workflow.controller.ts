import { Controller, Post, Put, Patch, Delete, Body, Get, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WorkflowResponseDto } from './dto/workflow-response.dto';
import { WorkflowStepTestResponseDto } from './dto/workflow-step-test-response.dto';
import { UpdateWorkflowStepDto } from './dto/update-workflow-step.dto';
import { WorkflowEntity } from './entities/workflow.entity';
import { WorkflowExecutionLogDto } from "./dto/workflow-execution.dto";
import { WorkflowExecutionLog } from "./entities/workflow-execution-log.entity";

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

  @Post(':id/steps/:stepName/test')
  @ApiOperation({ summary: 'Test a specific workflow step' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Step test results',
    type: WorkflowStepTestResponseDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Step not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid step configuration' })
  async testWorkflowStep(
    @Param('id') id: string,
    @Param('stepName') stepName: string,
  ): Promise<WorkflowStepTestResponseDto> {
    const result = await this.workflowService.testStep(id, stepName);
    return {
      success: true,
      stepName,
      response: result
    };
  }

  @Post(':id/steps')
  @ApiOperation({ summary: 'Add a new step to workflow' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Step added successfully',
    type: WorkflowEntity
  })
  async addWorkflowStep(
    @Param('id') id: string,
    @Body() stepDto: UpdateWorkflowStepDto
  ): Promise<WorkflowEntity> {
    return this.workflowService.addWorkflowStep(id, stepDto);
  }

  @Put(':id/steps/:stepName')
  @ApiOperation({ summary: 'Update a workflow step' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Step updated successfully',
    type: WorkflowEntity
  })
  async updateWorkflowStep(
    @Param('id') id: string,
    @Param('stepName') stepName: string,
    @Body() updateDto: UpdateWorkflowStepDto
  ): Promise<WorkflowEntity> {
    return this.workflowService.updateWorkflowStep(id, stepName, updateDto);
  }

  @Patch(':id/steps/:stepName')
  @ApiOperation({ summary: 'Partially update a workflow step' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Step updated successfully',
    type: WorkflowEntity
  })
  async patchWorkflowStep(
    @Param('id') id: string,
    @Param('stepName') stepName: string,
    @Body() updateDto: Partial<UpdateWorkflowStepDto>
  ): Promise<WorkflowEntity> {
    return this.workflowService.patchWorkflowStep(id, stepName, updateDto);
  }

  @Delete(':id/steps/:stepName')
  @ApiOperation({ summary: 'Delete a workflow step' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Step deleted successfully',
    type: WorkflowEntity
  })
  async deleteWorkflowStep(
    @Param('id') id: string,
    @Param('stepName') stepName: string
  ): Promise<WorkflowEntity> {
    return this.workflowService.deleteWorkflowStep(id, stepName);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a workflow' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow updated successfully',
    type: WorkflowEntity
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workflow not found'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid workflow data'
  })
  async updateWorkflow(
      @Param('id') id: string,
      @Body() updateDto: UpdateWorkflowDto
  ): Promise<WorkflowEntity> {
    console.log('Updating workflow with ID:', id);
    console.log('Update DTO:', JSON.stringify(updateDto, null, 2));
    return this.workflowService.updateWorkflow(id, updateDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a workflow' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow updated successfully',
    type: WorkflowEntity
  })
  async patchWorkflow(
      @Param('id') id: string,
      @Body() updateDto: UpdateWorkflowDto
  ): Promise<WorkflowEntity> {
    return this.workflowService.patchWorkflow(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workflow' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Workflow deleted successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workflow not found'
  })
  async deleteWorkflow(@Param('id') id: string): Promise<void> {
    await this.workflowService.deleteWorkflow(id);
  }


  @Get(':id/executions')
  @ApiOperation({ summary: 'Get workflow execution history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of workflow executions',
    type: [WorkflowExecutionLogDto]
  })
  async getExecutions(
      @Param('id') id: string
  ): Promise<WorkflowExecutionLog[]> {
    return this.workflowService.getExecutions(id);
  }

  @Get(':id/executions/:executionId')
  @ApiOperation({ summary: 'Get execution details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Execution details',
    type: WorkflowExecutionLogDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Execution not found'
  })
  async getExecution(
      @Param('id') id: string,
      @Param('executionId') executionId: string
  ): Promise<WorkflowExecutionLog> {
    return this.workflowService.getExecution(id, executionId);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute workflow' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow execution started',
    type: WorkflowExecutionLogDto
  })
  async executeWorkflow(
      @Param('id') id: string
  ): Promise<WorkflowExecutionLog> {
    return this.workflowService.executeWorkflow(id);
  }

  @Post(':id/executions/:executionId/retry')
  @ApiOperation({ summary: 'Retry failed execution' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Execution retry started',
    type: WorkflowExecutionLogDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Only failed executions can be retried'
  })
  async retryExecution(
      @Param('id') id: string,
      @Param('executionId') executionId: string
  ): Promise<WorkflowExecutionLog> {
    return this.workflowService.retryExecution(id, executionId);
  }

}