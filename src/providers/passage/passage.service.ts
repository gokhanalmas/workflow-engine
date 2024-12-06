import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseProviderService } from '../base-provider.service';
import { ICreatePassageUserRequest, IPassageUser } from './interfaces/passage.interface';
import { IProviderResponse } from '../base-provider.interface';

@Injectable()
export class PassageService extends BaseProviderService {
  constructor(private configService: ConfigService) {
    super('passage');
  }

  async authenticate(): Promise<{ token: string }> {
    // Passage API uses API key authentication
    return { token: this.config.additionalConfig?.apiKey || '' };
  }

  async getUsers(): Promise<IPassageUser[]> {
    const { token } = await this.authenticate();
    const response = await this.makeRequest<IPassageUser[]>(
      'GET',
      '/api/public/v1/users',
      null,
      {
        Authorization: `Bearer ${token}`,
      },
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch users from Passage');
    }

    return response.data;
  }

  async createUser(userData: ICreatePassageUserRequest, token: string): Promise<IProviderResponse<IPassageUser>> {
    return this.makeRequest<IPassageUser>(
      'POST',
      '/api/public/v1/users',
      userData,
      {
        Authorization: `Bearer ${token}`,
      },
    );
  }
}