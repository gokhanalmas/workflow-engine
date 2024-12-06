export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

export interface ApiConfig {
  port: number;
  externalApiUrl: string;
  jwtSecret: string;
}

export interface AppConfig {
  database: DatabaseConfig;
  api: ApiConfig;
}

export default (): AppConfig => ({
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'workflow_engine',
    ssl: process.env.DB_SSL === 'true'
  },
  api: {
    port: parseInt(process.env.API_PORT || '3000', 10),
    externalApiUrl: process.env.EXTERNAL_API_URL || 'http://localhost:4000',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret'
  }
});