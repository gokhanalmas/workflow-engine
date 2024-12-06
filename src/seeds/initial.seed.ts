import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { ProviderConfig } from '../tenants/entities/provider-config.entity';
import { PasswordService } from '../utils/password.service';

export class InitialSeed {
  constructor(private dataSource: DataSource) {}

  async run() {
    try {
      // Create default tenant
      const tenantRepository = this.dataSource.getRepository(Tenant);
      const tenant = tenantRepository.create({
        name: 'Default Tenant',
        domain: 'default.com',
        passageApiKey: 'default_passage_key'
      });

      const savedTenant = await tenantRepository.save(tenant);
      console.log('Default tenant created');

      // Create admin user
      const userRepository = this.dataSource.getRepository(User);
      const hashedPassword = await PasswordService.hash('Admin123!');
      const user = userRepository.create({
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        role: 'admin',
        tenant: savedTenant
      });

      await userRepository.save(user);
      console.log('Admin user created');

      // Create sample provider config
      const providerConfigRepository = this.dataSource.getRepository(ProviderConfig);
      const providerConfig = providerConfigRepository.create({
        providerName: 'sample_provider',
        apiUrl: 'https://api.sample-provider.com',
        username: 'sample_user',
        password: 'sample_pass',
        additionalConfig: {},
        tenant: savedTenant
      });

      await providerConfigRepository.save(providerConfig);
      console.log('Sample provider config created');

    } catch (error) {
      console.error('Error in initial seed:', error);
      throw error;
    }
  }
}