import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WorkflowStep } from '../interfaces/workflow.interface';
import { delay } from '../../utils/promise.utils';
import { TemplateService } from './template.service';

@Injectable()
export class WorkflowExecutionService {
  private readonly logger = new Logger(WorkflowExecutionService.name);
  private readonly templateService = new TemplateService();

  constructor(private readonly httpService: HttpService) {}

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