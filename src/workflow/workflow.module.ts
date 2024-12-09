import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WorkflowEntity } from './entities/workflow.entity';
import { WorkflowExecutionLog } from './entities/workflow-execution-log.entity';
import { WorkflowStepLog } from './entities/workflow-step-log.entity';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { WorkflowValidationService } from './services/workflow-validation.service';
import { TemplateService } from './services/template.service';
import { ApiLoggerService } from '../services/api-logger.service';
import { HttpLoggingInterceptor } from '../interceptors/http-logging.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PassageWorkflowProvider } from '../providers/passage/passage-workflow.provider';
import { UserTransformService } from '../providers/passage/services/user-transform.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowEntity,
      WorkflowExecutionLog,
      WorkflowStepLog
    ]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    WorkflowExecutionService,
    WorkflowValidationService,
    TemplateService,
    ApiLoggerService,
    PassageWorkflowProvider,
    UserTransformService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    }
  ],
  exports: [WorkflowService],
})
export class WorkflowModule {}