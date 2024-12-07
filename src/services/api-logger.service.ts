// src/services/api-logger.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class ApiLoggerService {
    private readonly logger = new Logger('API');

    constructor(private readonly httpService: HttpService) {
        // Add request interceptor
        this.httpService.axiosRef.interceptors.request.use(
            (config) => {
                this.logRequest(config);
                return config;
            },
            (error) => {
                this.logError(error);
                return Promise.reject(error);
            }
        );

        // Add response interceptor
        this.httpService.axiosRef.interceptors.response.use(
            (response) => {
                this.logResponse(response);
                return response;
            },
            (error) => {
                this.logError(error);
                return Promise.reject(error);
            }
        );
    }

    private logRequest(config: AxiosRequestConfig) {
        this.logger.debug(`
      🚀 Outgoing API Request:
      📍 ${config.method?.toUpperCase()} ${config.url}
      📤 Headers: ${JSON.stringify(config.headers, null, 2)}
      📦 Body: ${JSON.stringify(config.data, null, 2)}
    `);
    }

    private logResponse(response: AxiosResponse) {
        this.logger.debug(`
      ✅ API Response:
      📍 ${response.config.method?.toUpperCase()} ${response.config.url}
      📥 Status: ${response.status}
      📤 Headers: ${JSON.stringify(response.headers, null, 2)}
      📦 Body: ${JSON.stringify(response.data, null, 2)}
    `);
    }

    private logError(error: any) {
        this.logger.error(`
      ❌ API Error:
      📍 ${error.config?.method?.toUpperCase()} ${error.config?.url}
      🚨 Status: ${error.response?.status}
      📤 Request Headers: ${JSON.stringify(error.config?.headers, null, 2)}
      📦 Request Body: ${JSON.stringify(error.config?.data, null, 2)}
      📥 Response Headers: ${JSON.stringify(error.response?.headers, null, 2)}
      📦 Response Body: ${JSON.stringify(error.response?.data, null, 2)}
      💥 Error Message: ${error.message}
      📚 Stack: ${error.stack}
    `);
    }
}