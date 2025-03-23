import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositUpdate } from './deposit.update';
import { DepositScene } from './deposit.scene';
import { WalletModule } from '../wallet/wallet.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [WalletModule, SharedModule],
  providers: [DepositService, DepositUpdate, DepositScene],
  exports: [DepositService],
})
export class DepositModule {}
