import { AxiosRequestConfig } from 'axios';

export interface IProviderConfig {
  apiUrl: string;
  username: string;
  password: string;
  additionalConfig?: Record<string, any>;
}

export interface IProviderResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface IProvider {
  initialize(config: IProviderConfig): void;
  authenticate(): Promise<{ token: string }>;
  getUsers(): Promise<any[]>;
}