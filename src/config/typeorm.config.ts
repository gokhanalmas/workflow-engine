import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { WorkflowEntity } from '../workflow/entities/workflow.entity';

config();

const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [WorkflowEntity],
  migrations: ['dist/migrations/*.js'],
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  synchronize: false,
  logging: true,
};

const dataSource = new DataSource(options);
export default dataSource;