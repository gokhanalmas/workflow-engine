import { DataSource } from 'typeorm';
import { WorkflowEntity } from '../workflow/entities/workflow.entity';
import { HttpMethod } from '../workflow/interfaces/workflow.interface';
import { Tenant } from '../tenants/entities/tenant.entity';

export class WorkflowSeed {
  constructor(private dataSource: DataSource) {}

  async run() {
    // Get the default tenant
    const tenant = await this.dataSource.getRepository(Tenant)
      .findOne({ where: { domain: 'default.com' } });

    if (!tenant) {
      throw new Error('Default tenant not found');
    }

    const workflow = new WorkflowEntity();
    workflow.name = 'SampleAPIWorkflow';
    workflow.tenantId = tenant.id;
    workflow.definition = {
      workflowName: 'SampleAPIWorkflow',
      tenantId: tenant.id,
      steps: [
        {
          stepName: 'GetData',
          method: HttpMethod.GET,
          url: 'https://api.example.com/data',
          headers: {
            'Content-Type': 'application/json'
          },
          output: {
            items: '$.data'
          },
          retryConfig: {
            maxAttempts: 3,
            delayMs: 1000
          }
        },
        {
          stepName: 'ProcessData',
          method: HttpMethod.POST,
          url: 'https://api.example.com/process',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            items: '{{GetData.items}}'
          },
          dependsOn: ['GetData']
        }
      ]
    };

    await this.dataSource.getRepository(WorkflowEntity).save(workflow);
    console.log('Sample workflow created');
  }
}