import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { Tenant } from './entities/tenant.entity';
import { ProviderConfig } from './entities/provider-config.entity';
import { WorkflowModule } from '../workflow/workflow.module';
import {WorkflowEntity} from "../workflow/entities/workflow.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, ProviderConfig, WorkflowEntity]),
  ],
  providers: [TenantsService],
  controllers: [TenantsController],
  exports: [TenantsService],
})
export class TenantsModule {}