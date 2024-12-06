import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WorkflowStep } from '../interfaces/workflow.interface';
import { delay } from '../../utils/promise.utils';
import { TemplateService } from './template.service';

type StringRecord = Record<string, string>;

interface StepTestResponse {
  status: number;
  statusText: string;
  headers: StringRecord;
  data: any;
  error?: string;
  request: {
    method: string;
    url: string;
    headers: StringRecord;
    body: any;
  };
}

@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);
  private readonly templateService = new TemplateService();

  constructor(private readonly httpService: HttpService) {}

  async testStep(step: WorkflowStep, context: any): Promise<StepTestResponse> {
    try {
      const resolvedHeaders = this.templateService.resolveTemplateValues(step.headers || {}, context);
      const resolvedBody = this.templateService.resolveTemplateValues(step.body || {}, context);
      const resolvedUrl = this.templateService.resolveTemplateString(step.url, context);
      
      this.logger.debug(`Testing step ${step.stepName}: ${step.method} ${resolvedUrl}`);

      const response = await lastValueFrom(
        this.httpService.request({
          method: step.method,
          url: resolvedUrl,
          headers: resolvedHeaders,
          data: resolvedBody,
        })
      );

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.entries(response.headers).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as StringRecord),
        data: response.data,
        request: {
          method: step.method,
          url: resolvedUrl,
          headers: resolvedHeaders,
          body: resolvedBody
        }
      };
    } catch (error) {
      if (error.response) {
        return {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: Object.entries(error.response.headers || {}).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as StringRecord),
          data: error.response.data,
          error: error.message,
          request: {
            method: step.method,
            url: error.config.url,
            headers: error.config.headers || {},
            body: error.config.data
          }
        };
      }
      
      // For network or other errors without response
      const resolvedHeaders = this.templateService.resolveTemplateValues(step.headers || {}, context);
      const resolvedBody = this.templateService.resolveTemplateValues(step.body || {}, context);
      
      return {
        status: 0,
        statusText: 'Error',
        headers: {},
        data: null,
        error: error.message,
        request: {
          method: step.method,
          url: step.url,
          headers: resolvedHeaders,
          body: resolvedBody
        }
      };
    }
  }

  async executeStep(step: WorkflowStep, context: any): Promise<any> {
    const maxAttempts = step.retryConfig?.maxAttempts || 1;
    const delayMs = step.retryConfig?.delayMs || 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const resolvedHeaders = this.templateService.resolveTemplateValues(step.headers || {}, context);
        const resolvedBody = this.templateService.resolveTemplateValues(step.body || {}, context);
        const resolvedUrl = this.templateService.resolveTemplateString(step.url, context);

        this.logger.debug(`Executing step ${step.stepName}: ${step.method} ${resolvedUrl}`);

        const response = await lastValueFrom(
          this.httpService.request({
            method: step.method,
            url: resolvedUrl,
            headers: resolvedHeaders,
            data: resolvedBody,
          })
        );

        return response.data;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        this.logger.warn(
          `Step ${step.stepName} failed on attempt ${attempt}/${maxAttempts}, retrying after ${delayMs}ms`
        );
        await delay(delayMs);
      }
    }
  }
}