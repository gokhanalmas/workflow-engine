import { Injectable } from '@nestjs/common';
import { BaseProviderService } from '../base-provider.service';
import { IDerimodWorker, IDerimodAuthResponse } from './interfaces/derimod.interface';
import { IProviderResponse } from '../base-provider.interface';

@Injectable()
export class DerimodService extends BaseProviderService {
  constructor() {
    super('derimod');
  }

  async authenticate(): Promise<{ token: string }> {
    const credentials = {
      username: this.config.username,
      password: this.config.password,
    };

    const response = await this.makeRequest<IDerimodAuthResponse>(
      'POST',
      '/auth/login',
      credentials,
    );

    if (!response.success || !response.data?.token) {
      throw new Error('Failed to authenticate with Derimod');
    }

    return { token: response.data.token };
  }

  async getUsers(): Promise<IDerimodWorker[]> {
    const { token } = await this.authenticate();
    const response = await this.makeRequest<IDerimodWorker[]>(
      'GET',
      '/workers',
      null,
      {
        Authorization: `Bearer ${token}`,
      },
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch users from Derimod');
    }

    return response.data;
  }
}