import { Injectable } from '@nestjs/common';
import { CopperxApiService } from './modules/shared/copperx-api.service';

@Injectable()
export class AppService {
  constructor(private readonly copperx: CopperxApiService) {}
  getHello(): string {
    return 'Hello World!';
  }

  async getWelcomeMessage() {
    return this.copperx.get<string>('');
  }
}
