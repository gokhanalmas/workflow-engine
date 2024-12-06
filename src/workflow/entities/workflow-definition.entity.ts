import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { WorkflowExecution } from './workflow-execution.entity';
import { WorkflowDefinition } from '../interfaces/workflow.interface';

@Entity('workflow_definitions')
export class WorkflowDefinitionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.workflowDefinitions)
  tenant: Tenant;

  @Column({ type: 'jsonb' })
  definition: WorkflowDefinition;

  @OneToMany(() => WorkflowExecution, execution => execution.workflowDefinition)
  executions: WorkflowExecution[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}