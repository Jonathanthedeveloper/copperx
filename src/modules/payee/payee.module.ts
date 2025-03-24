import { Module } from '@nestjs/common';
import { PayeeService } from './payee.service';
import { PayeeUpdate } from './payee.update';
import { AddPayee } from './scenes/add-payee.scene';
import { RemovePayee } from './scenes/remove-payee.scene';

@Module({
  providers: [PayeeService, PayeeUpdate, AddPayee, RemovePayee],
  exports: [PayeeService],
})
export class PayeeModule {}
