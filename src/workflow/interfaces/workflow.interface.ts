// workflow.interface.ts

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

export interface ValidationConfig {
  conditions: string[];
}

export interface RetryStepConfig {
  retryStep: string;
}

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  onRetry?: RetryStepConfig;
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
  timeout?: number;
  iterateOver?: string;  // Path to array data for iteration (e.g., 'stepOutputs.GetUsers.users')
  transform?: {
    if?: string;
    then?: Record<string, any>;
  };
  fieldMappings?: Record<string, string>;
  customTransforms?: Array<(data: any) => Record<string, any>>;
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
  currentItem?: any;
}

export interface WorkflowResult {
  success: boolean;
  data?: any;
  error?: string;
  stepResults: Record<string, any>;
}