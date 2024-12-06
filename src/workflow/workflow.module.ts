import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WorkflowEntity } from './entities/workflow.entity';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { WorkflowValidationService } from './services/workflow-validation.service';
import { TemplateService } from './services/template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowEntity]),
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
    TemplateService
  ],
  exports: [WorkflowService],
})
export class WorkflowModule {}