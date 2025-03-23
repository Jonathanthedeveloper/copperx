import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletUpdate } from './wallet.update';

@Module({
  providers: [WalletService, WalletUpdate],
  exports: [WalletService],
})
export class WalletModule {}
