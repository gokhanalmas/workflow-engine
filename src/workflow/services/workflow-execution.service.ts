import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowStep } from '../interfaces/workflow.interface';
import { WorkflowStepLog } from '../entities/workflow-step-log.entity';
import { ExecutionStatus } from '../../enums/execution-status.enum';
import { TemplateService } from './template.service';
import { PassageWorkflowProvider } from "../../providers/passage/passage-workflow.provider";

import { delay } from '../../utils/promise.utils';
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

    constructor(
        private readonly httpService: HttpService,
        private readonly passageProvider: PassageWorkflowProvider,
        private readonly templateService: TemplateService,
        @InjectRepository(WorkflowStepLog)
        private readonly stepLogRepository: Repository<WorkflowStepLog>,
    ) {}

    // Mevcut metodlar aynen kalıyor
    private getIterationData(step: WorkflowStep, context: any): any[] {
        // Aynen mevcut implementasyon
        if (!step.iterateOver) return [null];

        const path = step.iterateOver.split('.');
        let data = context;

        for (const key of path) {
            if (!data || !data[key]) {
                this.logger.warn(`Iteration data not found at path: ${step.iterateOver}`);
                return [];
            }
            data = data[key];
        }

        if (!Array.isArray(data)) {
            this.logger.warn(`Iteration data at path ${step.iterateOver} is not an array`);
            return [];
        }

        return data;
    }

    async testStep(step: WorkflowStep, context: any): Promise<StepTestResponse> {
        // Mevcut implementasyon aynen kalıyor
        const requestConfig: any = {
            method: step.method,
            url: this.templateService.resolveTemplateString(step.url, context),
            headers: this.templateService.resolveTemplateValues(step.headers || {}, context),
        };

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

            const response = await lastValueFrom(this.httpService.request(requestConfig));

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
            // Mevcut hata handling aynen kalıyor
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
        // Mevcut iteration logic aynen kalıyor
        if (step.iterateOver) {
            const iterationData = this.getIterationData(step, context);
            const results = [];

            for (const item of iterationData) {
                const iterationContext = {
                    ...context,
                    currentItem: item
                };

                const result = await this.executeStepInternal(step, iterationContext, options);
                results.push(result);
            }

            return results;
        }

        return this.executeStepInternal(step, context, options);
    }

    private async executeStepInternal(step: WorkflowStep, context: any, options?: { timeout?: number }): Promise<any> {
        if (!context.executionId) {
            throw new Error('executionId is required in context');
        }

        // Step log oluştur
        let stepLog = this.stepLogRepository.create({
            executionId: context.executionId,  // Burada context'ten gelen executionId kullanılıyor
            stepName: step.stepName,
            status: ExecutionStatus.RUNNING,
            startedAt: new Date()
        });

        stepLog = await this.stepLogRepository.save(stepLog);
        const startTime = Date.now();

        try {
            if (this.passageProvider.isPassageCreateUserStep(step)) {
                try {
                    const result = await this.passageProvider.executeCreateUserStep(step, context);

                    // Başarılı durumu logla
                    stepLog.status = ExecutionStatus.COMPLETED;
                    stepLog.completedAt = new Date();
                    stepLog.durationMs = Date.now() - startTime;
                    stepLog.request = {
                        method: step.method,
                        url: step.url,
                        headers: this.sanitizeHeaders(step.headers || {}),
                        body: context.currentItem
                    };
                    stepLog.response = {
                        status: 200,
                        headers: {},
                        body: result
                    };
                    await this.stepLogRepository.save(stepLog);

                    return result;
                } catch (error) {
                    stepLog.status = ExecutionStatus.FAILED;
                    stepLog.completedAt = new Date();
                    stepLog.durationMs = Date.now() - startTime;
                    stepLog.error = error.message;
                    stepLog.response = error.response ? {
                        status: error.response.status,
                        headers: this.sanitizeHeaders(error.response.headers),
                        body: error.response.data
                    } : undefined;
                    await this.stepLogRepository.save(stepLog);

                    throw error;
                }
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

                    // Başarılı durumu logla
                    stepLog.status = ExecutionStatus.COMPLETED;
                    stepLog.completedAt = new Date();
                    stepLog.durationMs = Date.now() - startTime;
                    stepLog.request = {
                        method: requestConfig.method,
                        url: requestConfig.url,
                        headers: this.sanitizeHeaders(requestConfig.headers),
                        body: requestConfig.data
                    };
                    stepLog.response = {
                        status: response.status,
                        headers: this.sanitizeHeaders(response.headers),
                        body: response.data
                    };
                    await this.stepLogRepository.save(stepLog);

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
                    // Hata durumunu logla
                    stepLog.status = ExecutionStatus.FAILED;
                    stepLog.completedAt = new Date();
                    stepLog.durationMs = Date.now() - startTime;
                    stepLog.error = error.message;
                    stepLog.response = error.response ? {
                        status: error.response.status,
                        headers: this.sanitizeHeaders(error.response.headers),
                        body: error.response.data
                    } : undefined;
                    await this.stepLogRepository.save(stepLog);

                    if (attempt === maxAttempts) throw error;
                    this.logger.warn(`Step ${step.stepName} failed on attempt ${attempt}/${maxAttempts}, retrying after ${delayMs}ms`);
                    await delay(delayMs);
                }
            }
        } catch (error) {
            stepLog.status = ExecutionStatus.FAILED;
            stepLog.completedAt = new Date();
            stepLog.error = error.message;
            await this.stepLogRepository.save(stepLog);
            throw error;
        }
    }

    private async updateStepLog(stepLog: WorkflowStepLog, updates: Partial<WorkflowStepLog>): Promise<void> {
        try {
            Object.assign(stepLog, {
                ...updates,
                completedAt: new Date()
            });
            await this.stepLogRepository.save(stepLog);
        } catch (error) {
            this.logger.error(`Error updating step log: ${error.message}`);
        }
    }

    private sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
        const sanitized = {};
        for (const [key, value] of Object.entries(headers)) {
            if (key.toLowerCase().includes('authorization')) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = String(value);
            }
        }
        return sanitized;
    }
}