
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { WorkflowExecutionLog } from './workflow-execution-log.entity';
import { ExecutionStatus } from '../../enums/execution-status.enum';

@Entity('workflow_step_logs')
export class WorkflowStepLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'execution_id', type: 'uuid' })
    executionId: string;

    @Column({ name: 'step_name' })
    stepName: string;

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

    @Column({ name: 'duration_ms', nullable: true })
    durationMs: number;

    @Column({ type: 'jsonb', nullable: true })
    request: {
        method: string;
        url: string;
        headers: Record<string, string>;
        body?: any;
    };

    @Column({ type: 'jsonb', nullable: true })
    response: {
        status: number;
        headers: Record<string, string>;
        body: any;
    };

    @Column({ nullable: true })
    error: string;

    @ManyToOne(() => WorkflowExecutionLog, execution => execution.stepLogs)
    @JoinColumn({ name: 'execution_id' })
    execution: WorkflowExecutionLog;
}