import { Module } from '@nestjs/common';
import { AuthUpdate } from './auth.update';
import { AuthService } from './auth.service';
import { DepositModule } from '../deposit/deposit.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthScene } from './auth.scene';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
    DepositModule,
  ],
  providers: [AuthUpdate, AuthService, AuthScene],
  exports: [AuthService],
})
export class AuthModule {}
