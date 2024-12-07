// src/interceptors/http-logging.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const { method, originalUrl, body, headers } = request;
        const startTime = Date.now();

        this.logger.debug(`
      🌐 Request Details:
      📍 ${method} ${originalUrl}
      📤 Headers: ${JSON.stringify(headers, null, 2)}
      📦 Body: ${JSON.stringify(body, null, 2)}
    `);

        return next.handle().pipe(
            tap({
                next: (data) => {
                    const response = context.switchToHttp().getResponse<Response>();
                    const duration = Date.now() - startTime;

                    this.logger.debug(`
            ✅ Response Details:
            📍 ${method} ${originalUrl}
            ⏱️  Duration: ${duration}ms
            📥 Status: ${response.statusCode}
            📦 Response: ${JSON.stringify(data, null, 2)}
          `);
                },
                error: (error) => {
                    const duration = Date.now() - startTime;

                    this.logger.error(`
            ❌ Error Details:
            📍 ${method} ${originalUrl}
            ⏱️  Duration: ${duration}ms
            🚨 Error: ${error.message}
            📦 Stack: ${error.stack}
          `);
                }
            })
        );
    }
}