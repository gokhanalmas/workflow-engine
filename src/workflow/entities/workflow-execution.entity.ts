import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { WorkflowDefinitionEntity } from './workflow-definition.entity';

export enum WorkflowExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

@Entity('workflow_executions')
export class WorkflowExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_definition_id' })
  workflowDefinitionId: string;

  @ManyToOne(() => WorkflowDefinitionEntity, definition => definition.executions)
  workflowDefinition: WorkflowDefinitionEntity;

  @Column({
    type: 'enum',
    enum: WorkflowExecutionStatus,
    default: WorkflowExecutionStatus.PENDING
  })
  status: WorkflowExecutionStatus;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'finished_at', nullable: true })
  finishedAt: Date;

  @Column({ nullable: true })
  error: string;

  @Column({ name: 'step_results', type: 'jsonb', nullable: true })
  stepResults: Record<string, any>;
}