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
import { NestJsPusherOptions, PusherModule } from 'nestjs-pusher';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PusherModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): NestJsPusherOptions => {
        return {
          options: {
            appId: configService.get<string>('PUSHER_APP_ID') || '',
            key: configService.get<string>('PUSHER_KEY') || '',
            secret: configService.get<string>('PUSHER_SECRET') || '',
            cluster: configService.get<string>('PUSHER_CLUSTER') || '',
          },
          chunkingOptions: {
            limit: 9216,
            enabled: true,
          },
        };
      },
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const store = MySQL({
          host: '127.0.0.1',
          database: 'copperx',
          user: 'root',
          password: '',
        });
        return {
          token: configService.get<string>('TELEGRAM_BOT_TOKEN') || '',
          middlewares: [session({ store })],
        };
      },
    }),
    SharedModule,
    AuthModule,
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
