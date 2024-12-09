import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WorkflowStep } from '../interfaces/workflow.interface';
import { delay } from '../../utils/promise.utils';
import { TemplateService } from './template.service';
import {PassageWorkflowProvider} from "../../providers/passage/passage-workflow.provider";

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

  constructor(
      private readonly httpService: HttpService,
      private readonly passageProvider: PassageWorkflowProvider
  ) {}

  async testStep(step: WorkflowStep, context: any): Promise<StepTestResponse> {
    // Create request configuration outside try block for access in catch
    const requestConfig: any = {
      method: step.method,
      url: this.templateService.resolveTemplateString(step.url, context),
      headers: this.templateService.resolveTemplateValues(step.headers || {}, context),
    };

    // Only add body for non-GET/HEAD requests
    if (!['GET', 'HEAD'].includes(step.method)) {
      const resolvedBody = step.body ? this.templateService.resolveTemplateValues(step.body, context) : undefined;
      if (resolvedBody && Object.keys(resolvedBody).length > 0) {
        requestConfig.data = resolvedBody;
      }
    }

    try {
      this.logger.debug(`Testing step ${step.stepName}:`, {
        method: requestConfig.method,
        url: requestConfig.url,
        headers: requestConfig.headers
      });

      const response = await lastValueFrom(
          this.httpService.request(requestConfig)
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
          url: requestConfig.url,
          headers: requestConfig.headers,
          body: requestConfig.data
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
            url: requestConfig.url,
            headers: requestConfig.headers,
            body: requestConfig.data
          }
        };
      }

      return {
        status: 0,
        statusText: 'Error',
        headers: {},
        data: null,
        error: error.message,
        request: {
          method: step.method,
          url: requestConfig.url,
          headers: requestConfig.headers,
          body: requestConfig.data
        }
      };
    }
  }

  async executeStep(step: WorkflowStep, context: any, options?: { timeout?: number }): Promise<any> {
    if (this.passageProvider.isPassageCreateUserStep(step)) {
      return this.passageProvider.executeCreateUserStep(step, context);
    }

    const maxAttempts = step.retryConfig?.maxAttempts || 1;
    const delayMs = step.retryConfig?.delayMs || 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const requestConfig: any = {
          method: step.method,
          url: this.templateService.resolveTemplateString(step.url, context),
          headers: this.templateService.resolveTemplateValues(step.headers || {}, context),
          timeout: options?.timeout || 50000,
        };

        if (!['GET', 'HEAD'].includes(step.method)) {
          let resolvedBody = step.body ? this.templateService.resolveTemplateValues(step.body, context) : undefined;
          if (resolvedBody && step.url.includes('public/v1/users')) {
            resolvedBody = this.templateService.transformToPassageUser(context.currentItem, step);
          }
          if (resolvedBody && Object.keys(resolvedBody).length > 0) {
            requestConfig.data = resolvedBody;
          }
        }

        this.logger.debug(`Executing step ${step.stepName}:`, requestConfig);

        const response = await lastValueFrom(this.httpService.request(requestConfig));

        if (step.output && response.data) {
          if (!context.stepOutputs) {
            context.stepOutputs = {};
          }

          context.stepOutputs[step.stepName] = {};
          for (const [key, path] of Object.entries(step.output)) {
            const value = this.templateService.extractValue(response.data, path);
            context.stepOutputs[step.stepName][key] = value;
          }

          this.logger.debug(`Step ${step.stepName} outputs:`, context.stepOutputs[step.stepName]);
        }

        return response.data;

      } catch (error) {
        if (attempt === maxAttempts) throw error;
        this.logger.warn(`Step ${step.stepName} failed on attempt ${attempt}/${maxAttempts}, retrying after ${delayMs}ms`);
        await delay(delayMs);
      }
    }
  }

}