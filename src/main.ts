import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { CustomValidationPipe } from './pipes/custom-validation.pipe';

async function bootstrap() {
    // Detaylı loglama için logger instance'ı oluştur
    const logger = new Logger('Application');

    // Debug mode için log seviyelerini ayarla
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'debug', 'log', 'verbose'],
        bufferLogs: true // Log buffering aktif
    });

    const configService = app.get(ConfigService);
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
        logger.debug('Application running in DEVELOPMENT mode');
        logger.debug(`Environment Variables: 
            DB_HOST: ${configService.get('database.host')}
            API_PORT: ${configService.get('api.port')}
            NODE_ENV: ${process.env.NODE_ENV}
        `);
    }

    // Enable CORS with logging
    app.enableCors({
        origin: ['http://localhost:5173'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    logger.log('CORS enabled for development server');

    // Use custom validation pipe globally
    app.useGlobalPipes(new CustomValidationPipe());
    logger.log('Custom validation pipe configured');

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
    logger.log('Swagger documentation setup complete');

    const port = configService.get<number>('api.port');
    await app.listen(port);

    // Startup logging
    logger.log(`🚀 Application is running on port ${port}`);
    logger.log(`📚 API Documentation available at http://localhost:${port}/api`);

    if (isDevelopment) {
        logger.debug('Available endpoints:');
        const server = app.getHttpServer();
        const router = server._events.request._router;
        router.stack.forEach((layer: any) => {
            if (layer.route) {
                const path = layer.route?.path;
                const methods = Object.keys(layer.route.methods);
                logger.debug(`${methods.join(', ').toUpperCase()} ${path}`);
            }
        });
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    const logger = new Logger('UnhandledRejection');
    logger.error(`Unhandled Rejection at: ${promise}`, reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    const logger = new Logger('UncaughtException');
    logger.error('Uncaught Exception:', error);
});

bootstrap().catch(err => {
    const logger = new Logger('Bootstrap');
    logger.error('Failed to start application:', err);
    process.exit(1);
});