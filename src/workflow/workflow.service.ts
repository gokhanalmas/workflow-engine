import {BadRequestException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {WorkflowEntity} from './entities/workflow.entity';
import {CreateWorkflowDto} from './dto/create-workflow.dto';
import {UpdateWorkflowStepDto} from './dto/update-workflow-step.dto';
import {UpdateWorkflowDto} from './dto/update-workflow.dto';
import {WorkflowExecutionService} from './services/workflow-execution.service';
import {WorkflowValidationService} from './services/workflow-validation.service';
import {TemplateService} from './services/template.service';
import {WorkflowExecutionLog} from "./entities/workflow-execution-log.entity";
import {ExecutionStatus} from '../enums/execution-status.enum';
import {WorkflowStepLog} from "./entities/workflow-step-log.entity";
import {PageDto, PageMetaDto, PaginationDto} from "../common/dto/pagination.dto";

interface WorkflowExecutionResult {
    stepResults: Record<string, any>;
}

@Injectable()
export class WorkflowService {
    private readonly logger = new Logger(WorkflowService.name);

    // private readonly templateService = new TemplateService();

    constructor(
        @InjectRepository(WorkflowEntity)
        private workflowRepository: Repository<WorkflowEntity>,
        @InjectRepository(WorkflowExecutionLog)
        private executionLogRepository: Repository<WorkflowExecutionLog>,
        @InjectRepository(WorkflowStepLog)
        private stepLogRepository: Repository<WorkflowStepLog>,
        private readonly executionService: WorkflowExecutionService,
        private readonly validationService: WorkflowValidationService,
        private readonly templateService: TemplateService,
    ) {
    }

    async updateWorkflowStep(workflowId: string, stepName: string, updateDto: UpdateWorkflowStepDto): Promise<WorkflowEntity> {
        const workflow = await this.findOne(workflowId);
        const stepIndex = workflow.definition.steps.findIndex(s => s.stepName === stepName);

        if (stepIndex === -1) {
            throw new Error(`Step ${stepName} not found in workflow ${workflowId}`);
        }

        // Validate the updated step
        this.validationService.validateWorkflowSteps([updateDto]);

        // Update the step
        workflow.definition.steps[stepIndex] = {
            ...workflow.definition.steps[stepIndex],
            ...updateDto
        };

        return this.workflowRepository.save(workflow);
    }

    async patchWorkflowStep(workflowId: string, stepName: string, updateDto: Partial<UpdateWorkflowStepDto>): Promise<WorkflowEntity> {
        const workflow = await this.findOne(workflowId);
        const stepIndex = workflow.definition.steps.findIndex(s => s.stepName === stepName);

        if (stepIndex === -1) {
            throw new Error(`Step ${stepName} not found in workflow ${workflowId}`);
        }

        // Merge the existing step with the partial updates
        const updatedStep = {
            ...workflow.definition.steps[stepIndex],
            ...updateDto
        };

        // Validate the merged step
        this.validationService.validateWorkflowSteps([updatedStep]);

        // Update the step
        workflow.definition.steps[stepIndex] = updatedStep;

        return this.workflowRepository.save(workflow);
    }

    async deleteWorkflowStep(workflowId: string, stepName: string): Promise<WorkflowEntity> {
        const workflow = await this.findOne(workflowId);
        const stepIndex = workflow.definition.steps.findIndex(s => s.stepName === stepName);

        if (stepIndex === -1) {
            throw new Error(`Step ${stepName} not found in workflow ${workflowId}`);
        }

        // Remove step
        workflow.definition.steps.splice(stepIndex, 1);

        // Remove this step from any dependsOn arrays
        workflow.definition.steps.forEach(step => {
            if (step.dependsOn) {
                step.dependsOn = step.dependsOn.filter(dep => dep !== stepName);
            }
        });

        return this.workflowRepository.save(workflow);
    }

    async addWorkflowStep(workflowId: string, newStep: UpdateWorkflowStepDto): Promise<WorkflowEntity> {
        const workflow = await this.findOne(workflowId);

        // Validate the new step
        this.validationService.validateWorkflowSteps([newStep]);

        // Add the new step
        workflow.definition.steps.push(newStep);

        return this.workflowRepository.save(workflow);
    }

    async testStep(workflowId: string, stepName: string): Promise<any> {
        const workflow = await this.findOne(workflowId);
        const step = workflow.definition.steps.find(s => s.stepName === stepName);

        if (!step) {
            throw new Error(`Step ${stepName} not found in workflow ${workflowId}`);
        }

        const context = {
            stepOutputs: {},
            tenantId: workflow.tenantId,
            tenant: workflow
        };

        try {
            return await this.executionService.testStep(step, context);
        } catch (error) {
            this.logger.error(`Step test failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    async patchWorkflow(id: string, updateDto: UpdateWorkflowDto): Promise<WorkflowEntity> {
        const workflow = await this.findOne(id);

        // Update basic properties if provided
        if (updateDto.name) {
            workflow.name = updateDto.name;
        }

        // Update definition if provided
        if (updateDto.definition) {
            // Validate any new steps
            if (updateDto.definition.steps) {
                this.validationService.validateWorkflowSteps(updateDto.definition.steps);
            }

            workflow.definition = {
                ...workflow.definition,
                ...updateDto.definition,
                // Ensure tenantId remains unchanged
                tenantId: workflow.tenantId
            };
        }

        return this.workflowRepository.save(workflow);
    }

    async deleteWorkflow(id: string): Promise<void> {
        const workflow = await this.findOne(id);
        if (!workflow) {
            throw new NotFoundException(`Workflow with ID ${id} not found`);
        }
        await this.workflowRepository.remove(workflow);
    }

    async updateWorkflow(id: string, updateDto: UpdateWorkflowDto): Promise<WorkflowEntity> {
        const workflow = await this.findOne(id);

        // Validate any new steps if they exist
        if (updateDto.definition?.steps) {
            this.validationService.validateWorkflowSteps(updateDto.definition.steps);
        }

        // Update workflow properties
        const updatedWorkflow = {
            ...workflow,
            name: updateDto.name || workflow.name,
            definition: updateDto.definition ? {
                ...workflow.definition,
                ...updateDto.definition,
                // Ensure tenantId remains unchanged
                tenantId: workflow.tenantId
            } : workflow.definition
        };

        return this.workflowRepository.save(updatedWorkflow);
    }

    async createWorkflow(createWorkflowDto: CreateWorkflowDto): Promise<WorkflowEntity> {
        // Validate workflow steps
        this.validationService.validateWorkflowSteps(createWorkflowDto.steps);

        const workflow = this.workflowRepository.create({
            name: createWorkflowDto.name,
            tenantId: createWorkflowDto.tenantId,
            definition: {
                workflowName: createWorkflowDto.name,
                tenantId: createWorkflowDto.tenantId,
                steps: createWorkflowDto.steps
            }
        });

        return this.workflowRepository.save(workflow);
    }

    async findAll(paginationDto: PaginationDto): Promise<PageDto<WorkflowEntity>> {
        const {page = 1, limit = 10} = paginationDto;
        const skip = (page - 1) * limit;

        const [workflows, total] = await this.workflowRepository.findAndCount({
            skip,
            take: limit,
            order: {createdAt: 'DESC'}
        });

        const meta = new PageMetaDto(page, limit, total);
        return new PageDto(workflows, meta);
    }

    async findByNameAndTenant(name: string, tenantId: string): Promise<WorkflowEntity> {
        const workflow = await this.workflowRepository.findOne({
            where: {
                name,
                tenantId
            }
        });

        if (!workflow) {
            throw new Error(`Workflow ${name} not found for tenant ${tenantId}`);
        }

        return workflow;
    }

    async findOne(id: string): Promise<WorkflowEntity> {
        const workflow = await this.workflowRepository
            .createQueryBuilder('workflow')
            .leftJoinAndSelect('workflow.tenant', 'tenant')
            .where('workflow.id = :id', {id})
            .getOne();

        if (!workflow) {
            throw new NotFoundException(`Workflow with ID ${id} not found`);
        }

        if (!workflow.tenant) {
            throw new Error(`Workflow ${id} has no associated tenant`);
        }

        if (!workflow.tenant.passageApiKey) {
            throw new Error(`Passage API key not configured for tenant ${workflow.tenantId}`);
        }

        this.logger.debug('Found workflow with tenant:', {
            workflowId: id,
            tenantId: workflow.tenantId,
            hasPassageApiKey: !!workflow.tenant.passageApiKey
        });

        return workflow;
    }

    async getExecutions(workflowId: string): Promise<WorkflowExecutionLog[]> {
        const workflow = await this.findOne(workflowId);

        if (!workflow) {
            throw new NotFoundException(`Workflow with ID ${workflowId} not found`);
        }

        return this.executionLogRepository.find({
            where: {
                workflowId: workflow.id,
                tenantId: workflow.tenantId
            },
            relations: ['stepLogs'],
            order: {startedAt: 'DESC'},
        });
    }

    async getExecution(workflowId: string, executionId: string): Promise<WorkflowExecutionLog> {
        const workflow = await this.findOne(workflowId);

        const execution = await this.executionLogRepository.findOne({
            where: {
                id: executionId,
                workflowId: workflow.id,
            },
            relations: ['stepLogs'],
        });

        if (!execution) {
            throw new NotFoundException(
                `Execution ${executionId} not found for workflow ${workflowId}`,
            );
        }

        return execution;
    }

    async executeWorkflow(workflowId: string): Promise<WorkflowExecutionLog> {
        const workflow = await this.findOne(workflowId);
        if (!workflow.tenant) {
            throw new Error(`Workflow ${workflowId} has no associated tenant`);
        }
        // Yeni yürütme kaydı oluştur
        const executionLog = this.executionLogRepository.create({
            workflowId: workflow.id,
            tenantId: workflow.tenantId,
            status: ExecutionStatus.RUNNING,
        });

        await this.executionLogRepository.save(executionLog);

        try {
            const startTime = Date.now();
            const context = {
                stepOutputs: {},
                tenantId: workflow.tenantId,
                tenant: workflow,
            };

            const stepResults = {};
            const executedSteps = new Set<string>();

            // Adımları sırayla çalıştır
            for (const step of workflow.definition.steps) {
                // Bağımlılıkları kontrol et
                if (step.dependsOn) {
                    for (const dependency of step.dependsOn) {
                        if (!executedSteps.has(dependency)) {
                            throw new Error(
                                `Step ${step.stepName} depends on ${dependency} which hasn't been executed yet`,
                            );
                        }
                    }
                }

                // Adım logu oluştur
                const stepLog = this.stepLogRepository.create({
                    executionId: executionLog.id,
                    stepName: step.stepName,
                    status: ExecutionStatus.RUNNING,
                });
                await this.stepLogRepository.save(stepLog);

                const retryConfig = step.retryConfig || {maxAttempts: 1, delayMs: 0};
                const stepTimeout = step.timeout || 50000;

                for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
                    try {
                        const stepStartTime = Date.now();
                        this.logger.log(`Executing step ${step.stepName}, attempt ${attempt}`);

                        const result = await this.executionService.executeStep(step, context, {
                            timeout: stepTimeout,
                        });

                        // Başarıyla tamamlanan adımı logla
                        stepLog.status = ExecutionStatus.COMPLETED;
                        stepLog.completedAt = new Date();
                        stepLog.durationMs = Date.now() - stepStartTime;
                        stepLog.response = result;
                        await this.stepLogRepository.save(stepLog);

                        stepResults[step.stepName] = result;
                        executedSteps.add(step.stepName);

                        // Eğer çıktı tanımlıysa context'e ekle
                        if (step.output) {
                            Object.entries(step.output).forEach(([key, jsonPath]) => {
                                context.stepOutputs[`${step.stepName}.${key}`] =
                                    this.templateService.extractValue(result, jsonPath);
                            });
                        }

                        // Başarı durumunda döngüden çık
                        break;
                    } catch (error) {
                        this.logger.warn(
                            `Step ${step.stepName} failed on attempt ${attempt}: ${error.message}`,
                        );

                        if (attempt === retryConfig.maxAttempts) {
                            // Maksimum deneme yapıldı, hata fırlat
                            stepLog.status = ExecutionStatus.FAILED;
                            stepLog.completedAt = new Date();
                            stepLog.error = error.message;
                            await this.stepLogRepository.save(stepLog);
                            throw error;
                        }

                        // Retry öncesi bekleme
                        await new Promise((resolve) => setTimeout(resolve, retryConfig.delayMs));
                    }
                }
            }

            // Başarılı yürütme logunu güncelle
            executionLog.status = ExecutionStatus.COMPLETED;
            executionLog.completedAt = new Date();
            executionLog.totalDurationMs = Date.now() - startTime;
            await this.executionLogRepository.save(executionLog);

            // Workflow son sonucu güncelle
            workflow.lastResult = stepResults;
            await this.workflowRepository.save(workflow);

            return executionLog;
        } catch (error) {
            // Hata durumunda yürütme logunu güncelle
            executionLog.status = ExecutionStatus.FAILED;
            executionLog.completedAt = new Date();
            executionLog.error = error.message;
            await this.executionLogRepository.save(executionLog);

            this.logger.error(`Workflow execution failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    async retryExecution(workflowId: string, executionId: string): Promise<WorkflowExecutionLog> {
        const workflow = await this.findOne(workflowId);
        const execution = await this.getExecution(workflowId, executionId);

        if (execution.status !== ExecutionStatus.FAILED) {
            throw new BadRequestException('Only failed executions can be retried');
        }

        // Yeni bir yürütme kaydı oluştur
        const newExecution = this.executionLogRepository.create({
            workflowId: workflow.id,
            tenantId: workflow.tenantId,
            status: ExecutionStatus.RUNNING,
        });

        await this.executionLogRepository.save(newExecution);

        // Workflow'u tekrar çalıştır
        return this.executeWorkflow(workflow.id);
    }
}