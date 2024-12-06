import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkflowTables1697123456790 implements MigrationInterface {
    name = 'CreateWorkflowTables1697123456790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "workflow_definitions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" character varying,
                "tenant_id" uuid NOT NULL,
                "definition" jsonb NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_workflow_definitions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_workflow_definitions_tenants" FOREIGN KEY ("tenant_id") 
                    REFERENCES "tenants"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "workflow_executions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "workflow_definition_id" uuid NOT NULL,
                "status" character varying NOT NULL,
                "started_at" TIMESTAMP NOT NULL DEFAULT now(),
                "finished_at" TIMESTAMP,
                "error" character varying,
                "step_results" jsonb,
                CONSTRAINT "PK_workflow_executions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_workflow_executions_definitions" FOREIGN KEY ("workflow_definition_id") 
                    REFERENCES "workflow_definitions"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_workflow_executions_status" ON "workflow_executions" ("status");
            CREATE INDEX "IDX_workflow_executions_started_at" ON "workflow_executions" ("started_at");
            CREATE INDEX "IDX_workflow_definitions_tenant" ON "workflow_definitions" ("tenant_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_workflow_definitions_tenant"`);
        await queryRunner.query(`DROP INDEX "IDX_workflow_executions_started_at"`);
        await queryRunner.query(`DROP INDEX "IDX_workflow_executions_status"`);
        await queryRunner.query(`DROP TABLE "workflow_executions"`);
        await queryRunner.query(`DROP TABLE "workflow_definitions"`);
    }
}