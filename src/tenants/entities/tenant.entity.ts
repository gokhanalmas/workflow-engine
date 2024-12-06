import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProviderConfig } from './provider-config.entity';
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

  @OneToMany(() => WorkflowDefinitionEntity, workflow => workflow.tenant)
  workflowDefinitions: WorkflowDefinitionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}