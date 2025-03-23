import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppUpdate } from './app.update';
import { APP_FILTER } from '@nestjs/core';
import { TelegramExceptionFilter } from './exceptions/telegram-exception.filter';
import { AuthModule } from './modules/auth/auth.module';
import { SharedModule } from './modules/shared/shared.module';
import { MySQL } from '@telegraf/session/mysql';
import { session } from 'telegraf';
import { WalletModule } from './modules/wallet/wallet.module';
import { TransferModule } from './modules/transfer/transfer.module';
import { DepositModule } from './modules/deposit/deposit.module';
import { PayeeModule } from './modules/payee/payee.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { PointsModule } from './modules/points/points.module';
import { ReferralModule } from './modules/referral/referral.module';
import { KycModule } from './modules/kyc/kyc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const store = MySQL({
          host: configService.get<string>('DATABASE_HOST'),
          database: configService.get<string>('DATABASE_NAME'),
          user: configService.get<string>('DATABASE_USER'),
          password: configService.get<string>('DATABASE_PASSWORD'),
        });
        return {
          token: configService.get<string>('TELEGRAM_BOT_TOKEN') || '',
          middlewares: [session({ store })],
          botName: 'CopperX Wallet',
        };
      },
    }),
    SharedModule,
    AuthModule,
    WalletModule,
    TransferModule,
    DepositModule,
    PayeeModule,
    TransactionsModule,
    PointsModule,
    ReferralModule,
    KycModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppUpdate,
    {
      provide: APP_FILTER,
      useClass: TelegramExceptionFilter,
    },
  ],
})
export class AppModule {}
