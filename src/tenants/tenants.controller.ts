import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateProviderConfigDto } from './dto/create-provider-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Tenant } from './entities/tenant.entity';
import { ProviderConfig } from './entities/provider-config.entity';

@ApiTags('Tenants')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: Tenant,
  })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({
    status: 200,
    description: 'List of all tenants',
    type: [Tenant],
  })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant details',
    type: Tenant
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findById(id);
  }

  @Post(':id/provider-config')
  @ApiOperation({ summary: 'Add provider configuration to tenant' })
  @ApiResponse({
    status: 201,
    description: 'Provider configuration added successfully',
    type: ProviderConfig,
  })
  addProviderConfig(
    @Param('id') tenantId: string,
    @Body() config: CreateProviderConfigDto,
  ) {
    return this.tenantsService.addProviderConfig(tenantId, config);
  }

  @Get(':id/provider-config/:provider')
  @ApiOperation({ summary: 'Get provider configuration' })
  @ApiResponse({
    status: 200,
    description: 'Provider configuration details',
    type: ProviderConfig,
  })
  getProviderConfig(
    @Param('id') tenantId: string,
    @Param('provider') providerName: string,
  ) {
    return this.tenantsService.getProviderConfig(tenantId, providerName);
  }
}