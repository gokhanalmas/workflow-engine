import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { PassageService } from '../providers/passage/passage.service';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  providers: [SyncService, PassageService],
  exports: [SyncService],
})
export class SyncModule {}