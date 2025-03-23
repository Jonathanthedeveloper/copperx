import { Injectable } from '@nestjs/common';
import { CopperxApiService } from '../shared/copperx-api.service';
import { User } from 'src/types';

@Injectable()
export class AuthService {
  constructor(private readonly copperx: CopperxApiService) {}

  async requestAuthOtp({ email }: { email: string }) {
    const response = await this.copperx.post<{ email: string; sid: string }>(
      'api/auth/email-otp/request',
      {
        email,
      },
    );

    return response;
  }

  async authenticate({
    email,
    otp,
    sid,
  }: {
    email: string;
    otp: string;
    sid: string;
  }) {
    const response = await this.copperx.post<{
      scheme: string;
      accessToken: string;
      accessTokenId: string;
      expireAt: string;
      user: User;
    }>('api/auth/email-otp/authenticate', {
      email,
      otp,
      sid,
    });

    return response;
  }

  async getUserProfile(accessToken: string): Promise<User> {
    return await this.copperx.get('api/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async logout(accessToken: string) {
    return await this.copperx.post(
      'api/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }
}
