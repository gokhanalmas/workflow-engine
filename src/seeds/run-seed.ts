import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { ProviderConfig } from '../tenants/entities/provider-config.entity';
import { WorkflowEntity } from '../workflow/entities/workflow.entity';
import { InitialSeed } from './initial.seed';
import { WorkflowSeed } from './workflow.seed';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'workflow_engine',
  entities: [User, Tenant, ProviderConfig, WorkflowEntity],
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
});

async function runSeed() {
  try {
    await dataSource.initialize();
    console.log('Data Source initialized');

    const initialSeed = new InitialSeed(dataSource);
    await initialSeed.run();
    console.log('Initial seed completed');

    const workflowSeed = new WorkflowSeed(dataSource);
    await workflowSeed.run();
    console.log('Workflow seed completed');
    
    console.log('All seeds completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during seed:', error);
    process.exit(1);
  }
}

runSeed();