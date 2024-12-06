import { Injectable, BadRequestException } from '@nestjs/common';
import { WorkflowStep, HttpMethod } from '../interfaces/workflow.interface';

@Injectable()
export class WorkflowValidationService {
  validateWorkflowSteps(steps: WorkflowStep[]): void {
    const stepNames = new Set<string>();

    for (const step of steps) {
      // Validate step name
      if (!step.stepName) {
        throw new BadRequestException('Step name is required');
      }

      if (stepNames.has(step.stepName)) {
        throw new BadRequestException(`Duplicate step name: ${step.stepName}`);
      }

      // Validate method
      if (!Object.values(HttpMethod).includes(step.method)) {
        throw new BadRequestException(`Invalid HTTP method for step ${step.stepName}`);
      }

      // Validate URL
      if (!step.url) {
        throw new BadRequestException(`URL is required for step ${step.stepName}`);
      }

      // Validate dependencies
      if (step.dependsOn) {
        for (const dependency of step.dependsOn) {
          if (!stepNames.has(dependency)) {
            throw new BadRequestException(
              `Step ${step.stepName} depends on ${dependency} which hasn't been defined yet`
            );
          }
        }
      }

      // Add step to executed steps
      stepNames.add(step.stepName);
    }
  }
}