import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { DerimodService } from '../providers/derimod/derimod.service';
import { PassageService } from '../providers/passage/passage.service';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  providers: [SyncService, DerimodService, PassageService],
  exports: [SyncService],
})
export class SyncModule {}