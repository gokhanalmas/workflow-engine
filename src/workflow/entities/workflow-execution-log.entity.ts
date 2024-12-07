
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { WorkflowEntity } from './workflow.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { WorkflowStepLog } from './workflow-step-log.entity';
import { ExecutionStatus } from '../../enums/execution-status.enum';

@Entity('workflow_execution_logs')
export class WorkflowExecutionLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'workflow_id', type: 'uuid' })
    workflowId: string;

    @Column({ name: 'tenant_id', type: 'uuid' })
    tenantId: string;

    @Column({
        type: 'enum',
        enum: ExecutionStatus,
        default: ExecutionStatus.PENDING
    })
    status: ExecutionStatus;

    @CreateDateColumn({ name: 'started_at' })
    startedAt: Date;

    @Column({ name: 'completed_at', nullable: true })
    completedAt: Date;

    @Column({ name: 'total_duration_ms', nullable: true })
    totalDurationMs: number;

    @Column({ nullable: true })
    error: string;

    @ManyToOne(() => WorkflowEntity, workflow => workflow.executionLogs)
    @JoinColumn({ name: 'workflow_id' })
    workflow: WorkflowEntity;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @OneToMany(() => WorkflowStepLog, stepLog => stepLog.execution, {
        cascade: true,
        eager: true
    })
    stepLogs: WorkflowStepLog[];
}