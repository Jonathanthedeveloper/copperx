import { Injectable } from '@nestjs/common';
import { CopperxApiService } from '../shared/copperx-api.service';
import { Kyc } from 'src/types';

@Injectable()
export class KycService {
  constructor(private readonly copperx: CopperxApiService) {}

  async listKycs(accessToken: string) {
    return this.copperx.get<{
      page: number;
      limit: number;
      count: number;
      hasMore: true;
      data: Kyc[];
    }>('api/kycs', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}
