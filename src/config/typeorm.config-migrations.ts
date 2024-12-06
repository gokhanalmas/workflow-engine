import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { ProviderConfig } from '../tenants/entities/provider-config.entity';
import { WorkflowDefinitionEntity } from '../workflow/entities/workflow-definition.entity';
import { WorkflowExecution } from '../workflow/entities/workflow-execution.entity';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'api_integration',
  entities: [User, Tenant, ProviderConfig, WorkflowDefinitionEntity, WorkflowExecution],
  migrations: ['src/migrations/*.ts'],
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
});

export default dataSource;