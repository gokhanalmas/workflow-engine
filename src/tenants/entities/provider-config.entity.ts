import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('provider_configs')
export class ProviderConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  providerName: string;

  @Column()
  apiUrl: string;

  @Column()
  username: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'jsonb', nullable: true })
  additionalConfig: Record<string, any>;

  @ManyToOne(() => Tenant, tenant => tenant.providerConfigs)
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}