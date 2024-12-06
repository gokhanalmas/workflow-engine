import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowDefinitionEntity } from './entities/workflow-definition.entity';
import { WorkflowExecution, WorkflowExecutionStatus } from './entities/workflow-execution.entity';
import { WorkflowDefinition } from './interfaces/workflow.interface';

@Injectable()
export class WorkflowRepository {
  constructor(
    @InjectRepository(WorkflowDefinitionEntity)
    private workflowDefinitionRepo: Repository<WorkflowDefinitionEntity>,
    @InjectRepository(WorkflowExecution)
    private workflowExecutionRepo: Repository<WorkflowExecution>
  ) {}

  async createWorkflowDefinition(tenantId: string, definition: WorkflowDefinition) {
    const workflowDef = this.workflowDefinitionRepo.create({
      name: definition.workflowName,
      tenantId,
      definition
    });
    return this.workflowDefinitionRepo.save(workflowDef);
  }

  async findWorkflowDefinition(id: string) {
    return this.workflowDefinitionRepo.findOne({ 
      where: { id },
      relations: ['tenant', 'tenant.providerConfigs']
    });
  }

  async createExecution(workflowDefinitionId: string): Promise<WorkflowExecution> {
    const execution = this.workflowExecutionRepo.create({
      workflowDefinitionId,
      status: WorkflowExecutionStatus.PENDING
    });
    return this.workflowExecutionRepo.save(execution);
  }

  async updateExecution(id: string, data: Partial<WorkflowExecution>): Promise<WorkflowExecution> {
    await this.workflowExecutionRepo.update(id, data);
    return this.workflowExecutionRepo.findOne({ where: { id } });
  }
}