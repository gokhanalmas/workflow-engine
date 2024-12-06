import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowEntity } from './entities/workflow.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowStepDto } from './dto/update-workflow-step.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { WorkflowValidationService } from './services/workflow-validation.service';
import { TemplateService } from './services/template.service';

interface WorkflowExecutionResult {
  stepResults: Record<string, any>;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);
  private readonly templateService = new TemplateService();

  async updateWorkflowStep(workflowId: string, stepName: string, updateDto: UpdateWorkflowStepDto): Promise<WorkflowEntity> {
    const workflow = await this.findOne(workflowId);
    const stepIndex = workflow.definition.steps.findIndex(s => s.stepName === stepName);
    
    if (stepIndex === -1) {
      throw new Error(`Step ${stepName} not found in workflow ${workflowId}`);
    }

    // Validate the updated step
    this.validationService.validateWorkflowSteps([updateDto]);

    // Update the step
    workflow.definition.steps[stepIndex] = {
      ...workflow.definition.steps[stepIndex],
      ...updateDto
    };

    return this.workflowRepository.save(workflow);
  }

  async deleteWorkflowStep(workflowId: string, stepName: string): Promise<WorkflowEntity> {
    const workflow = await this.findOne(workflowId);
    const stepIndex = workflow.definition.steps.findIndex(s => s.stepName === stepName);
    
    if (stepIndex === -1) {
      throw new Error(`Step ${stepName} not found in workflow ${workflowId}`);
    }

    // Remove step
    workflow.definition.steps.splice(stepIndex, 1);

    // Remove this step from any dependsOn arrays
    workflow.definition.steps.forEach(step => {
      if (step.dependsOn) {
        step.dependsOn = step.dependsOn.filter(dep => dep !== stepName);
      }
    });

    return this.workflowRepository.save(workflow);
  }

  async addWorkflowStep(workflowId: string, newStep: UpdateWorkflowStepDto): Promise<WorkflowEntity> {
    const workflow = await this.findOne(workflowId);
    
    // Validate the new step
    this.validationService.validateWorkflowSteps([newStep]);

    // Add the new step
    workflow.definition.steps.push(newStep);

    return this.workflowRepository.save(workflow);
  }

  async testStep(workflowId: string, stepName: string): Promise<any> {
    const workflow = await this.findOne(workflowId);
    const step = workflow.definition.steps.find(s => s.stepName === stepName);
    
    if (!step) {
      throw new Error(`Step ${stepName} not found in workflow ${workflowId}`);
    }

    const context = {
      stepOutputs: {},
      tenantId: workflow.tenantId,
      tenant: workflow
    };

    try {
      return await this.executionService.testStep(step, context);
    } catch (error) {
      this.logger.error(`Step test failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async patchWorkflow(id: string, updateDto: UpdateWorkflowDto): Promise<WorkflowEntity> {
    const workflow = await this.findOne(id);
    
    // Update basic properties if provided
    if (updateDto.name) {
      workflow.name = updateDto.name;
    }
    
    // Update definition if provided
    if (updateDto.definition) {
      // Validate any new steps
      if (updateDto.definition.steps) {
        this.validationService.validateWorkflowSteps(updateDto.definition.steps);
      }
      
      workflow.definition = {
        ...workflow.definition,
        ...updateDto.definition,
        // Ensure tenantId remains unchanged
        tenantId: workflow.tenantId
      };
    }
    
    return this.workflowRepository.save(workflow);
  }

  constructor(
    private readonly executionService: WorkflowExecutionService,
    private readonly validationService: WorkflowValidationService,
    @InjectRepository(WorkflowEntity)
    private workflowRepository: Repository<WorkflowEntity>
  ) {}

  async createWorkflow(createWorkflowDto: CreateWorkflowDto): Promise<WorkflowEntity> {
    // Validate workflow steps
    this.validationService.validateWorkflowSteps(createWorkflowDto.steps);

    const workflow = this.workflowRepository.create({
      name: createWorkflowDto.name,
      tenantId: createWorkflowDto.tenantId,
      definition: {
        workflowName: createWorkflowDto.name,
        tenantId: createWorkflowDto.tenantId,
        steps: createWorkflowDto.steps
      }
    });

    return this.workflowRepository.save(workflow);
  }

  async findAll(): Promise<WorkflowEntity[]> {
    return this.workflowRepository.find();
  }

  async findByNameAndTenant(name: string, tenantId: string): Promise<WorkflowEntity> {
    const workflow = await this.workflowRepository.findOne({
      where: { 
        name,
        tenantId
      }
    });

    if (!workflow) {
      throw new Error(`Workflow ${name} not found for tenant ${tenantId}`);
    }

    return workflow;
  }

  async findOne(id: string): Promise<WorkflowEntity> {
    const workflow = await this.workflowRepository.findOne({
      where: { id }
    });


    if (!workflow) {
      throw new Error(`Workflow with ID ${id} not found`);
    }


    return workflow;
  }

  async executeWorkflow(workflowId: string): Promise<WorkflowExecutionResult> {
    const workflow = await this.findOne(workflowId);
    const context = {
      stepOutputs: {},
      tenantId: workflow.tenantId,
      tenant: workflow
    };

    try {
      const stepResults = {};
      const executedSteps = new Set<string>();

      for (const step of workflow.definition.steps) {
        if (step.dependsOn) {
          for (const dependency of step.dependsOn) {
            if (!executedSteps.has(dependency)) {
              throw new Error(`Step ${step.stepName} depends on ${dependency} which hasn't been executed yet`);
            }
          }
        }

        const result = await this.executionService.executeStep(step, context);
        stepResults[step.stepName] = result;
        executedSteps.add(step.stepName);

        if (step.output) {
          Object.entries(step.output).forEach(([key, jsonPath]) => {
            context.stepOutputs[`${step.stepName}.${key}`] = this.templateService.extractValue(result, jsonPath);
          });
        }
      }

      workflow.lastResult = stepResults;
      await this.workflowRepository.save(workflow);
      
      return { 
        stepResults,
      };
    } catch (error) {
      this.logger.error(`Workflow execution failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}