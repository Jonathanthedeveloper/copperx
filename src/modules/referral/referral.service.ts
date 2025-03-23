import { Injectable } from '@nestjs/common';
import { CopperxApiService } from '../shared/copperx-api.service';
import { InviteCode } from 'src/types';

@Injectable()
export class ReferralService {
  constructor(private readonly copperx: CopperxApiService) {}

  async listInviteCodes(accessToken: string) {
    return this.copperx.get<{ data: InviteCode[] }>('api/invite-codes', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async validateAndUseInviteCode(accessToken: string, code: string) {
    return this.copperx.post<InviteCode>(
      'api/invite-codes/validate',
      {
        code,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }
}
