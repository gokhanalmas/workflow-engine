import { DataSource } from 'typeorm';
import { WorkflowEntity } from '../workflow/entities/workflow.entity';
import { HttpMethod } from '../workflow/interfaces/workflow.interface';

export class WorkflowSeed {
  constructor(private dataSource: DataSource) {}

  async run() {
    const tenantRepository = this.dataSource.getRepository('Tenant');
    const defaultTenant = await tenantRepository.findOne({
      where: { name: 'Default Tenant' }
    });

    if (!defaultTenant) {
      console.log('Default tenant not found, skipping workflow seed');
      return;
    }

    const workflow = new WorkflowEntity();
    workflow.name = 'SampleAPIWorkflow';
    workflow.tenantId = defaultTenant.id;
    workflow.definition = {
      workflowName: 'SampleAPIWorkflow',
      tenantId: defaultTenant.id,
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