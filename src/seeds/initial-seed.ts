import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { ProviderConfig } from '../tenants/entities/provider-config.entity';
import { PasswordService } from '../utils/password.service';

export class InitialSeed {
  constructor(private dataSource: DataSource) {}

  async run() {
    // Create default tenant
    const tenant = await this.dataSource.getRepository(Tenant).save({
      name: 'Default Tenant',
      domain: 'default.com',
      passageApiKey: 'default_passage_key'
    });

    // Create admin user
    const hashedPassword = await PasswordService.hash('Admin123!');
    await this.dataSource.getRepository(User).save({
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'admin',
      tenant: tenant
    });

    // Create sample provider config
    await this.dataSource.getRepository(ProviderConfig).save({
      providerName: 'sample_provider',
      apiUrl: 'https://api.sample-provider.com',
      username: 'sample_user',
      password: 'sample_pass',
      additionalConfig: {},
      tenant: tenant
    });
  }
}