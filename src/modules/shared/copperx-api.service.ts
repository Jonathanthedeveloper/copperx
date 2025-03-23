import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

@Injectable()
export class CopperxApiService {
  private readonly apiClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.apiClient = axios.create({
      baseURL: this.configService.get<string>('COPPERX_API_URL'),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.apiClient.get<T>(endpoint, config);
    return data;
  }

  async post<T>(
    endpoint: string,
    payload: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const { data } = await this.apiClient.post<T>(endpoint, payload, config);
    return data;
  }

  async put<T>(
    endpoint: string,
    payload: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const { data } = await this.apiClient.put<T>(endpoint, payload, config);
    return data;
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.apiClient.delete<T>(endpoint, config);
    return data;
  }
}
