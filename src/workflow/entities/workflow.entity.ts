import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowDefinition } from '../interfaces/workflow.interface';

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

  @ApiProperty()
  @Column({ type: 'jsonb' })
  definition: WorkflowDefinition;

  @ApiProperty({ required: false })
  @Column({ name: 'last_result', type: 'jsonb', nullable: true })
  lastResult?: Record<string, any>;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}