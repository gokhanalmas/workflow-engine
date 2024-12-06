import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe());
  
  const config = new DocumentBuilder()
    .setTitle('Workflow Engine API')
    .setDescription(`
      API for managing workflow definitions and executions.
      
      This API allows you to:
      - Create and manage tenants
      - Define and execute API workflows
      - Configure provider integrations
      - Monitor workflow executions
    `)
    .setVersion('1.0')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Tenants', 'Tenant management endpoints')
    .addTag('Workflows', 'Workflow management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();