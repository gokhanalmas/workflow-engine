import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1697123456789 implements MigrationInterface {
    name = 'CreateInitialTables1697123456789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "role" character varying NOT NULL,
                "password" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "tenantId" uuid,
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "provider_configs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "providerName" character varying NOT NULL,
                "apiUrl" character varying NOT NULL,
                "username" character varying NOT NULL,
                "password" character varying NOT NULL,
                "additionalConfig" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "tenantId" uuid,
                CONSTRAINT "PK_provider_configs" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "tenants" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "domain" character varying NOT NULL,
                "passageApiKey" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_tenants" 
            FOREIGN KEY ("tenantId") 
            REFERENCES "tenants"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "provider_configs" 
            ADD CONSTRAINT "FK_provider_configs_tenants" 
            FOREIGN KEY ("tenantId") 
            REFERENCES "tenants"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provider_configs" DROP CONSTRAINT "FK_provider_configs_tenants"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_tenants"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP TABLE "provider_configs"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}