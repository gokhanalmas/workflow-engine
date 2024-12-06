export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
}

export interface WorkflowStep {
  stepName: string;
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  output?: Record<string, string>;
  dependsOn?: string[];
  retryConfig?: RetryConfig;
}

export interface WorkflowDefinition {
  workflowName: string;
  tenantId: string;
  steps: WorkflowStep[];
}

export interface WorkflowContext {
  stepOutputs: Record<string, any>;
  tenantId: string;
  tenant?: any;
}

export interface WorkflowResult {
  success: boolean;
  data?: any;
  error?: string;
  stepResults: Record<string, any>;
}