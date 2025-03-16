import { Global, Module } from '@nestjs/common';
import { CopperxApiService } from './copperx-api.service';
import { ConfigModule } from '@nestjs/config';
import { KeyboardsService } from './keyboard.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CopperxApiService, KeyboardsService],
  exports: [CopperxApiService, KeyboardsService],
})
export class SharedModule {}
