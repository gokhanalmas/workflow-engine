import { Injectable, Logger } from '@nestjs/common';
import { BaseProviderService } from '../base-provider.service';
import { WorkflowStep } from '../../workflow/interfaces/workflow.interface';
import { UserTransformService } from './services/user-transform.service';
import { IProviderResponse } from '../base-provider.interface';

interface ExtendedWorkflowStep extends WorkflowStep {
    transform?: {
        if?: string;
        then?: Record<string, any>;
    };
    fieldMappings?: Record<string, string>;
    customTransforms?: Array<(data: any) => Record<string, any>>;
}

@Injectable()
export class PassageWorkflowProvider extends BaseProviderService {
    private readonly logger = new Logger(PassageWorkflowProvider.name);

    constructor(private readonly userTransformService: UserTransformService) {
        super('passage');
    }

    async authenticate(): Promise<{ token: string }> {
        return { token: this.config?.additionalConfig?.apiKey || '' };
    }

    async getUsers(): Promise<any[]> {
        const response: IProviderResponse<any[]> = await this.makeRequest('GET', '/api/public/v1/users');
        return response.success && response.data ? response.data : [];
    }

    isPassageCreateUserStep(step: WorkflowStep): boolean {
        return step.url.includes('/api/public/v1/users') &&
            step.method === 'POST' &&
            step.body?.user;
    }

    async executeCreateUserStep(step: ExtendedWorkflowStep, context: any): Promise<any> {
        try {
            let resolvedBody = this.userTransformService.transformToPassageUser(
                context.currentItem,
                {
                    fieldMappings: step.fieldMappings,
                    conditions: [{
                        if: step.transform?.if,
                        then: step.transform?.then
                    }],
                    customTransforms: step.customTransforms
                }
            );

            const apiKey = context.tenant.passageApiKey;
            if (!apiKey) {
                throw new Error('Passage API key not found in tenant configuration');
            }

            const response = await this.makeRequest<any>(
                'POST',
                '/api/public/v1/users',
                resolvedBody,
                {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            );

            if (!response.success) {
                throw new Error(`Failed to create Passage user: ${response.error}`);
            }

            return response.data;

        } catch (error) {
            this.logger.error(`Error in Passage create user step: ${error.message}`);
            throw error;
        }
    }
}