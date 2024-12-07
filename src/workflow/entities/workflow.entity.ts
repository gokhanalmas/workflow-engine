// src/workflow/entities/workflow.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowDefinition } from '../interfaces/workflow.interface';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { WorkflowExecutionLog } from './workflow-execution-log.entity';

@Entity('workflows')
export class WorkflowEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.workflows)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ApiProperty()
  @Column({ type: 'jsonb' })
  definition: WorkflowDefinition;

  @ApiProperty({ required: false })
  @Column({ name: 'last_result', type: 'jsonb', nullable: true })
  lastResult?: Record<string, any>;

  @OneToMany(() => WorkflowExecutionLog, log => log.workflow)
  executionLogs: WorkflowExecutionLog[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}