import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { ProviderConfig } from '../tenants/entities/provider-config.entity';
import { WorkflowDefinitionEntity } from '../workflow/entities/workflow-definition.entity';
import { WorkflowExecution } from '../workflow/entities/workflow-execution.entity';
import { WorkflowEntity } from '../workflow/entities/workflow.entity';

config();

const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User,
    Tenant,
    ProviderConfig,
    WorkflowDefinitionEntity,
    WorkflowExecution,
    WorkflowEntity
  ],
  migrations: ['dist/migrations/*.js'],
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  synchronize: false,
  logging: true,
};

const dataSource = new DataSource(options);
export default dataSource;