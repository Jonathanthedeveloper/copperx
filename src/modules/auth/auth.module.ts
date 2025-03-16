import { Module } from '@nestjs/common';
import { AuthUpdate } from './auth.update';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthUpdate, AuthService],
})
export class AuthModule {}
