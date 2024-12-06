import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkflowTables1701808000003 implements MigrationInterface {
    name = 'CreateWorkflowTables1701808000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "workflows" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "tenant_id" uuid NOT NULL,
                "definition" jsonb NOT NULL,
                "last_result" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_workflows" PRIMARY KEY ("id"),
                CONSTRAINT "FK_workflows_tenant" FOREIGN KEY ("tenant_id") 
                    REFERENCES "tenants"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_workflows_tenant" ON "workflows" ("tenant_id");
            CREATE INDEX "IDX_workflows_name" ON "workflows" ("name");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_workflows_name"`);
        await queryRunner.query(`DROP INDEX "IDX_workflows_tenant"`);
        await queryRunner.query(`DROP TABLE "workflows"`);
    }
}