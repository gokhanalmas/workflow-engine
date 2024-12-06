import { HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { IProvider, IProviderConfig, IProviderResponse } from './base-provider.interface';

export abstract class BaseProviderService implements IProvider {
  protected client: AxiosInstance;
  protected config: IProviderConfig;
  protected providerName: string;

  constructor(providerName: string) {
    this.providerName = providerName;
  }

  initialize(config: IProviderConfig): void {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for consistent error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorResponse = {
          provider: this.providerName,
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        };
        throw new HttpException(
          errorResponse,
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      },
    );
  }

  abstract authenticate(): Promise<{ token: string }>;
  abstract getUsers(): Promise<any[]>;

  protected async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
    config?: AxiosRequestConfig,
  ): Promise<IProviderResponse<T>> {
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        data,
        headers,
        ...config,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}