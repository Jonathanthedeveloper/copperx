import { Injectable } from '@nestjs/common';
import { CopperxApiService } from '../shared/copperx-api.service';

type AllPoints = {
  offrampTransferPoints: {
    data: Array<OffRampTransferPoint>;
  };
  payoutReferralPoints: {
    data: Array<ReferralPoint>;
  };
};
type OffRampTransferPoint = {
  amountUSD: string;
  noOfTransactions: number;
  multiplier: number;
  perUsdPoint: number;
  points: number;
};

type ReferralPoint = {
  reference: string;
  totalPoints: number;
  transactionPoints: number;
  referralPoints: number;
  totalTransactions: number;
};

@Injectable()
export class PointsService {
  constructor(private readonly copperx: CopperxApiService) {}

  async getTotalPoints(accessToken: string) {
    return this.copperx.get<{ total: number }>('api/points/total', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getAllPoints(accessToken: string) {
    return this.copperx.get<AllPoints>('api/points/all', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getOfframpTransferPoints(accessToken: string) {
    return this.copperx.get<{ data: OffRampTransferPoint[] }>(
      'api/points/offramp-transfer-points',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  async getReferralPoints(accessToken: string) {
    return this.copperx.get<{ data: ReferralPoint[] }>(
      'api/points/referrer-points',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }
}
