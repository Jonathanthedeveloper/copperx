import { Module } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { TransferUpdate } from './transfer.update';
import { EmailTransfer } from './scenes/email-transfer.scene';
import { PayeeModule } from '../payee/payee.module';
import { WalletTransferScene } from './scenes/wallet-transfer.scene';

@Module({
  imports: [PayeeModule],
  providers: [
    TransferService,
    TransferUpdate,
    EmailTransfer,
    WalletTransferScene,
  ],
})
export class TransferModule {}
