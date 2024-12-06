@@ .. @@
   findAll(): Promise<WorkflowEntity[]>;
   findByNameAndTenant(name: string, tenantId: string): Promise<WorkflowEntity>;
   findOne(id: string): Promise<WorkflowEntity>;
-  executeWorkflow(workflowId: string): Promise<void>;
+  executeWorkflow(workflowId: string): Promise<{ stepResults: Record<string, any> }>;
 }