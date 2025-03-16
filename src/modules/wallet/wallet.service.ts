import { Injectable } from '@nestjs/common';
import { CopperxApiService } from '../shared/copperx-api.service';
import { Wallet, WalletBalance } from 'src/types';

@Injectable()
export class WalletService {
  constructor(private readonly copperx: CopperxApiService) {}

  async getWallets(accessToken: string): Promise<Wallet[]> {
    return this.copperx.get('api/wallets', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getBalances(accessToken: string): Promise<WalletBalance[]> {
    return this.copperx.get('api/wallets/balances', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async setDefaultWallet(accessToken: string, walletId: string) {
    return this.copperx.post(
      'api/wallets/default',
      {
        walletId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  }

  async getDefaultWallet(accessToken: string): Promise<Wallet> {
    return this.copperx.get('api/wallets/default', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}
