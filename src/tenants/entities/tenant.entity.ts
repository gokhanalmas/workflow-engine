// In tenant.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProviderConfig } from './provider-config.entity';
import { WorkflowEntity } from '../../workflow/entities/workflow.entity';
import { WorkflowDefinitionEntity } from '../../workflow/entities/workflow-definition.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  domain: string;

  @Column()
  passageApiKey: string;

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @OneToMany(() => ProviderConfig, config => config.tenant)
  providerConfigs: ProviderConfig[];

  @OneToMany(() => WorkflowEntity, workflow => workflow.tenant)
  workflows: WorkflowEntity[];

  @OneToMany(() => WorkflowDefinitionEntity, workflowDefinition => workflowDefinition.tenant)
  workflowDefinitions: WorkflowDefinitionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}