import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { ProviderConfig } from './entities/provider-config.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateProviderConfigDto } from './dto/create-provider-config.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(ProviderConfig)
    private providerConfigsRepository: Repository<ProviderConfig>,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantsRepository.create(createTenantDto);
    return this.tenantsRepository.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantsRepository.find({
      relations: ['providerConfigs']
    });
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id },
      relations: ['providerConfigs', 'users', 'workflowDefinitions']
    });
    
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    
    return tenant;
  }

  async addProviderConfig(tenantId: string, config: CreateProviderConfigDto): Promise<ProviderConfig> {
    const tenant = await this.findById(tenantId);
    
    const providerConfig = this.providerConfigsRepository.create({
      ...config,
      tenant
    });

    return this.providerConfigsRepository.save(providerConfig);
  }

  async getProviderConfig(tenantId: string, providerName: string): Promise<ProviderConfig> {
    const config = await this.providerConfigsRepository.findOne({
      where: {
        tenant: { id: tenantId },
        providerName,
      },
      relations: ['tenant']
    });

    if (!config) {
      throw new NotFoundException(
        `Provider config for ${providerName} not found for tenant ${tenantId}`
      );
    }

    return config;
  }
}