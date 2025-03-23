import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionUpdate } from './transactions.update';

@Module({
  providers: [TransactionsService, TransactionUpdate],
})
export class TransactionsModule {}
