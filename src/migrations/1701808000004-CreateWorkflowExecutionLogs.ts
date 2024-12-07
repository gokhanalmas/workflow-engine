import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkflowExecutionLogs1701808000004 implements MigrationInterface {
    name = 'CreateWorkflowExecutionLogs1701808000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First drop existing tables if they exist
        await queryRunner.query(`DROP TABLE IF EXISTS "workflow_step_logs" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workflow_execution_logs" CASCADE`);

        // Create enum type for execution status
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE execution_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Ana execution log tablosu
        await queryRunner.query(`
            CREATE TABLE "workflow_execution_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "workflow_id" uuid NOT NULL,
                "tenant_id" uuid NOT NULL,
                "status" execution_status NOT NULL DEFAULT 'PENDING',
                "started_at" TIMESTAMP NOT NULL DEFAULT now(),
                "completed_at" TIMESTAMP,
                "total_duration_ms" integer,
                "error" text,
                CONSTRAINT "PK_workflow_execution_logs" PRIMARY KEY ("id")
            )
        `);

        // Step execution detayları için tablo
        await queryRunner.query(`
            CREATE TABLE "workflow_step_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "execution_id" uuid NOT NULL,
                "step_name" varchar NOT NULL,
                "status" execution_status NOT NULL DEFAULT 'PENDING',
                "started_at" TIMESTAMP NOT NULL DEFAULT now(),
                "completed_at" TIMESTAMP,
                "duration_ms" integer,
                "request" jsonb,
                "response" jsonb,
                "error" text,
                CONSTRAINT "PK_workflow_step_logs" PRIMARY KEY ("id")
            )
        `);

        // Foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "workflow_execution_logs" 
            ADD CONSTRAINT "FK_workflow_execution_logs_workflow" 
            FOREIGN KEY ("workflow_id") 
            REFERENCES "workflows"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "workflow_execution_logs" 
            ADD CONSTRAINT "FK_workflow_execution_logs_tenant" 
            FOREIGN KEY ("tenant_id") 
            REFERENCES "tenants"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "workflow_step_logs" 
            ADD CONSTRAINT "FK_workflow_step_logs_execution" 
            FOREIGN KEY ("execution_id") 
            REFERENCES "workflow_execution_logs"("id") ON DELETE CASCADE
        `);

        // Indexes for better query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_workflow_execution_logs_workflow" ON "workflow_execution_logs" ("workflow_id");
            CREATE INDEX "IDX_workflow_execution_logs_tenant" ON "workflow_execution_logs" ("tenant_id");
            CREATE INDEX "IDX_workflow_execution_logs_status" ON "workflow_execution_logs" ("status");
            CREATE INDEX "IDX_workflow_execution_logs_started" ON "workflow_execution_logs" ("started_at");
            CREATE INDEX "IDX_workflow_step_logs_execution" ON "workflow_step_logs" ("execution_id");
            CREATE INDEX "IDX_workflow_step_logs_status" ON "workflow_step_logs" ("status");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workflow_step_logs_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workflow_step_logs_execution"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workflow_execution_logs_started"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workflow_execution_logs_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workflow_execution_logs_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workflow_execution_logs_workflow"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE IF EXISTS "workflow_step_logs" DROP CONSTRAINT IF EXISTS "FK_workflow_step_logs_execution"`);
        await queryRunner.query(`ALTER TABLE IF EXISTS "workflow_execution_logs" DROP CONSTRAINT IF EXISTS "FK_workflow_execution_logs_tenant"`);
        await queryRunner.query(`ALTER TABLE IF EXISTS "workflow_execution_logs" DROP CONSTRAINT IF EXISTS "FK_workflow_execution_logs_workflow"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "workflow_step_logs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workflow_execution_logs"`);

        // Drop enum type
        await queryRunner.query(`DROP TYPE IF EXISTS execution_status`);
    }
}