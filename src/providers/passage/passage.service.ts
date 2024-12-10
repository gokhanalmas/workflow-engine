// passage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseProviderService } from '../base-provider.service';
import {
  IPassageUser,
  ICreatePassageUserRequest,
  IUpdatePassageUserRequest,
  IPassageUserResponse,
  IPassageUserListResponse,
  PassageEndpoints,
  IPassageListParams,
  IPassageResponse
} from './interfaces/passage.interface';

@Injectable()
export class PassageService extends BaseProviderService {
  private readonly logger = new Logger(PassageService.name);

  constructor(private readonly configService: ConfigService) {
    super('passage');
  }

  async initialize(config: any): Promise<void> {
    try {
      this.config = {
        apiUrl: config.apiUrl || this.configService.get<string>('PASSAGE_API_URL'),
        username: config.username || this.configService.get<string>('PASSAGE_USERNAME'),
        password: config.password || this.configService.get<string>('PASSAGE_PASSWORD'),
        additionalConfig: {
          apiKey: config.apiKey || this.configService.get<string>('PASSAGE_API_KEY')
        }
      };

      if (!this.config.additionalConfig?.apiKey) {
        throw new Error('Passage API key is required');
      }

      this.logger.log('Passage service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Passage service:', error);
      throw error;
    }
  }

  async authenticate(): Promise<{ token: string }> {
    try {
      if (!this.config?.additionalConfig?.apiKey) {
        throw new Error('Passage API key is not configured');
      }
      return { token: this.config.additionalConfig.apiKey };
    } catch (error) {
      this.logger.error('Authentication failed:', error);
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<string> {
    try {
      const { token } = await this.authenticate();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }
      return token;
    } catch (error) {
      this.logger.error('Failed to ensure authentication:', error);
      throw error;
    }
  }

  async getUsers(params?: IPassageListParams): Promise<IPassageUser[]> {
    try {
      const token = await this.ensureAuthenticated();
      const response = await this.makeRequest<IPassageUserListResponse>(
          'GET',
          PassageEndpoints.USERS,
          null,
          this.getHeaders(token)
      );

      if (!response.success || !response.data?.users) {
        return [];
      }

      return response.data.users;
    } catch (error) {
      this.logger.error('Error getting users:', error);
      return [];
    }
  }

  async getUser(id: string): Promise<IPassageUserResponse> {
    try {
      const token = await this.ensureAuthenticated();
      const response = await this.makeRequest<IPassageResponse<IPassageUser>>(
          'GET',
          `${PassageEndpoints.USERS}/${id}`,
          null,
          this.getHeaders(token)
      );

      return response;
    } catch (error) {
      this.logger.error(`Error getting user ${id}:`, error);
      throw error;
    }
  }

  async createUser(userData: ICreatePassageUserRequest): Promise<IPassageUserResponse> {
    const token = await this.ensureAuthenticated();
    const response = await this.makeRequest<IPassageUserResponse>(
        'POST',
        PassageEndpoints.USERS,
        userData,
        this.getHeaders(token),
    );

    if (!response.success) {
      throw new Error('Error creating user');
    }

    return response;
  }
  async updateUser(id: string, userData: IUpdatePassageUserRequest): Promise<IPassageUserResponse> {
    try {
      const token = await this.ensureAuthenticated();
      const response = await this.makeRequest<IPassageResponse<IPassageUser>>(
          'PUT',
          `${PassageEndpoints.USERS}/${id}`,
          userData,
          this.getHeaders(token)
      );

      return response;
    } catch (error) {
      this.logger.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  async patchUser(id: string, userData: Partial<IUpdatePassageUserRequest>): Promise<IPassageUserResponse> {
    try {
      const token = await this.ensureAuthenticated();
      const response = await this.makeRequest<IPassageResponse<IPassageUser>>(
          'PATCH',
          `${PassageEndpoints.USERS}/${id}`,
          userData,
          this.getHeaders(token)
      );

      return response;
    } catch (error) {
      this.logger.error(`Error patching user ${id}:`, error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<IPassageUserResponse> {
    try {
      const token = await this.ensureAuthenticated();
      const response = await this.makeRequest<IPassageResponse<IPassageUser>>(
          'DELETE',
          `${PassageEndpoints.USERS}/${id}`,
          null,
          this.getHeaders(token)
      );

      return response;
    } catch (error) {
      this.logger.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  private getHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}