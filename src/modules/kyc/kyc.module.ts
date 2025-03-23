import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycUpdate } from './kyc.update';

@Module({
  providers: [KycService, KycUpdate],
})
export class KycModule {}
