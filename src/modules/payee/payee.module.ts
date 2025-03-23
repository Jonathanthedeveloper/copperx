import { Module } from '@nestjs/common';
import { PayeeService } from './payee.service';
import { PayeeUpdate } from './payee.update';
import { AddPayee } from './scenes/add-payee.scene';
import { SharedModule } from '../shared/shared.module';
import { RemovePayee } from './scenes/remove-payee.scene';

@Module({
  imports: [SharedModule],
  providers: [PayeeService, PayeeUpdate, AddPayee, RemovePayee],
  exports: [PayeeService],
})
export class PayeeModule {}
