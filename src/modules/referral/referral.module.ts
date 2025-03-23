import { Module } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralUpdate } from './referral.update';

@Module({
  providers: [ReferralService, ReferralUpdate],
})
export class ReferralModule {}
