import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowEntity } from './entities/workflow.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { WorkflowValidationService } from './services/workflow-validation.service';
import { TemplateService } from './services/template.service';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);
  private readonly templateService = new TemplateService();

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

  async findOne(id: string): Promise<WorkflowEntity> {
    const workflow = await this.workflowRepository.findOne({
      where: { id }
    });

    if (!workflow) {
      throw new Error(`Workflow with ID ${id} not found`);
    }

    return workflow;
  }

  async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.findOne(workflowId);
    const context = {
      stepOutputs: {},
      tenantId: workflow.tenantId
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
    } catch (error) {
      this.logger.error(`Workflow execution failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}