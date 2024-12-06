import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { WorkflowEntity } from '../workflow/entities/workflow.entity';
import { WorkflowSeed } from './workflow.seed';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [WorkflowEntity],
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
});

async function runSeed() {
  try {
    await dataSource.initialize();
    console.log('Data Source initialized');

    const workflowSeed = new WorkflowSeed(dataSource);
    await workflowSeed.run();
    
    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during seed:', error);
    process.exit(1);
  }
}

runSeed();