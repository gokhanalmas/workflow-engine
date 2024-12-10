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

class PassageError extends Error {
    constructor(
        message: string,
        public readonly step: string,
        public readonly context: any,
        public readonly response?: any
    ) {
        super(message);
        this.name = 'PassageError';
    }
}

interface ValidationRule {
    field: string;
    message: string;
    validate: (value: any) => boolean;
}

@Injectable()
export class PassageWorkflowProvider extends BaseProviderService {
    private readonly logger = new Logger(PassageWorkflowProvider.name);

    constructor(private readonly userTransformService: UserTransformService) {
        super('passage');
    }

    // async authenticate(): Promise<{ token: string }> {
    //     if (!this.config?.additionalConfig?.apiKey) {
    //         throw new PassageError(
    //             'Passage API key is not configured',
    //             'authentication',
    //             { hasConfig: !!this.config }
    //         );
    //     }
    //     return { token: this.config.additionalConfig.apiKey };
    // }

    async authenticate(): Promise<{ token: string }> {
        return { token: this.config?.additionalConfig?.apiKey || '' };
    }

    async getUsers(): Promise<any[]> {
        const response: IProviderResponse<any[]> = await this.makeRequest('GET', '/api/public/v1/users');
        return response.success && response.data ? response.data : [];
    }

    isPassageStep(step: WorkflowStep): boolean {
        return step.url.includes('/api/public/v1/');
    }

    isPassageCreateUserStep(step: WorkflowStep): boolean {
        return (
            step.url.includes('/api/public/v1/users') &&
            step.method === 'POST' &&
            step.body?.user
        );
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

    private validatePassageContext(context: any, step: ExtendedWorkflowStep): void {
        if (!context?.tenant?.passageApiKey) {
            throw new PassageError(
                `Passage API key is required for step ${step.stepName}`,
                step.stepName,
                { hasTenant: !!context?.tenant }
            );
        }

        // POST metodu için özel validasyonlar
        if (step.method === 'POST') {
            const createUserEndpoint = step.url.includes('/users');
            if (createUserEndpoint) {
                this.validateUserCreationContext(context, step);
            }
        }
    }

    private validateUserCreationContext(context: any, step: ExtendedWorkflowStep): void {
        if (!context.currentItem) {
            throw new PassageError(
                'User data is required for user creation',
                step.stepName,
                { hasCurrentItem: false }
            );
        }

        const userValidationRules: ValidationRule[] = [
            {
                field: 'email',
                message: 'Email is required',
                validate: (value) => !!value && this.isValidEmail(value)
            },
            {
                field: 'firstName',
                message: 'First name is required',
                validate: (value) => !!value && value.length > 0
            },
            {
                field: 'lastName',
                message: 'Last name is required',
                validate: (value) => !!value && value.length > 0
            }
        ];

        const errors = this.validateData(context.currentItem, userValidationRules);
        if (errors.length > 0) {
            throw new PassageError(
                `Invalid user data: ${errors.join(', ')}`,
                step.stepName,
                { validationErrors: errors }
            );
        }
    }

    private validateData(data: any, rules: ValidationRule[]): string[] {
        const errors: string[] = [];
        for (const rule of rules) {
            if (!rule.validate(data[rule.field])) {
                errors.push(rule.message);
            }
        }
        return errors;
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async executePassageStep(step: ExtendedWorkflowStep, context: any): Promise<any> {
        try {
            this.validatePassageContext(context, step);

            switch (step.method) {
                case 'GET':
                    return this.handlePassageGet(step, context);
                case 'POST':
                    return this.handlePassagePost(step, context);
                case 'PUT':
                    return this.handlePassagePut(step, context);
                case 'DELETE':
                    return this.handlePassageDelete(step, context);
                default:
                    throw new PassageError(
                        `Unsupported HTTP method: ${step.method}`,
                        step.stepName,
                        { method: step.method }
                    );
            }
        } catch (error) {
            if (error instanceof PassageError) {
                throw error;
            }

            throw new PassageError(
                error.message,
                step.stepName,
                {
                    hasCurrentItem: !!context?.currentItem,
                    hasTenant: !!context?.tenant,
                    hasPassageApiKey: !!context?.tenant?.passageApiKey
                },
                error.response
            );
        }
    }

    private async handlePassageGet(step: ExtendedWorkflowStep, context: any): Promise<any> {
        const response = await this.makeRequest(
            'GET',
            step.url,
            null,
            {
                'Authorization': `Bearer ${context.tenant.passageApiKey}`,
                'Content-Type': 'application/json',
                ...step.headers
            }
        );

        if (!response.success) {
            throw new PassageError(
                `Passage GET request failed: ${response.error}`,
                step.stepName,
                { endpoint: step.url },
                response
            );
        }

        return response.data;
    }

    private async handlePassagePost(step: ExtendedWorkflowStep, context: any): Promise<any> {
        let requestBody = step.body;

        // User creation endpoint için özel transform
        if (step.url.includes('/users')) {
            requestBody = this.userTransformService.transformToPassageUser(
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
        }

        const response = await this.makeRequest(
            'POST',
            step.url,
            requestBody,
            {
                'Authorization': `Bearer ${context.tenant.passageApiKey}`,
                'Content-Type': 'application/json',
                ...step.headers
            }
        );

        if (!response.success) {
            throw new PassageError(
                `Passage POST request failed: ${response.error}`,
                step.stepName,
                { endpoint: step.url },
                response
            );
        }

        return response.data;
    }

    private async handlePassagePut(step: ExtendedWorkflowStep, context: any): Promise<any> {
        const response = await this.makeRequest(
            'PUT',
            step.url,
            step.body,
            {
                'Authorization': `Bearer ${context.tenant.passageApiKey}`,
                'Content-Type': 'application/json',
                ...step.headers
            }
        );

        if (!response.success) {
            throw new PassageError(
                `Passage PUT request failed: ${response.error}`,
                step.stepName,
                { endpoint: step.url },
                response
            );
        }

        return response.data;
    }

    private async handlePassageDelete(step: ExtendedWorkflowStep, context: any): Promise<any> {
        const response = await this.makeRequest(
            'DELETE',
            step.url,
            null,
            {
                'Authorization': `Bearer ${context.tenant.passageApiKey}`,
                'Content-Type': 'application/json',
                ...step.headers
            }
        );

        if (!response.success) {
            throw new PassageError(
                `Passage DELETE request failed: ${response.error}`,
                step.stepName,
                { endpoint: step.url },
                response
            );
        }

        return response.data;
    }
}