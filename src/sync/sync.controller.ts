import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('tenant/:tenantId')
  async syncTenantUsers(@Param('tenantId') tenantId: string) {
    return this.syncService.syncTenantUsers(tenantId);
  }
}