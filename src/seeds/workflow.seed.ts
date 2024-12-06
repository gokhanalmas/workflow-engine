import { DataSource } from 'typeorm';
import { WorkflowEntity } from '../workflow/entities/workflow.entity';
import { HttpMethod } from '../workflow/interfaces/workflow.interface';

export class WorkflowSeed {
  constructor(private dataSource: DataSource) {}

  async run() {
    const workflow = new WorkflowEntity();
    workflow.name = 'SampleAPIWorkflow';
    workflow.tenantId = '00000000-0000-0000-0000-000000000000'; // Default tenant ID
    workflow.definition = {
      workflowName: 'SampleAPIWorkflow',
      tenantId: '00000000-0000-0000-0000-000000000000',
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
  }
}