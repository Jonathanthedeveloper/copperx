import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CopperxApiService } from '../shared/copperx-api.service';
import Pusher from 'pusher-js';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

@Injectable()
export class DepositService {
  constructor(
    private readonly configService: ConfigService,
    private readonly copperx: CopperxApiService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}
  subscribeToDepositEvents({
    accessToken,
    organizationId,
    chatId,
  }: {
    accessToken: string;
    organizationId: string;
    chatId: string | number;
  }) {
    const pusherCluster = this.configService.get<string>('PUSHER_CLUSTER');
    const pusherKey = this.configService.get<string>('PUSHER_KEY');

    if (!pusherCluster || !pusherKey) {
      throw new Error('Pusher cluster and key are required');
    }

    // Initialize Pusher client with authentication
    const pusherClient = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          this.copperx
            .post<{
              auth: string;
              user_data: string;
            }>(
              '/api/notifications/auth',
              {
                socket_id: socketId,
                channel_name: channel.name,
              },
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            )
            .then((response) => {
              if (response) {
                callback(null, response);
              } else {
                callback(new Error('Pusher authentication failed'), null);
              }
            })
            .catch((error) => {
              console.error('Pusher authorization error:', error);
              callback(error as Error, null);
            });
        },
      }),
    });

    // Subscribe to organization's private channel
    const channel = pusherClient.subscribe(`private-org-${organizationId}`);

    channel.bind('pusher:subscription_succeeded', () => {
      this.bot.telegram.sendMessage(
        chatId,
        `🔔 *Sucessfully Subscribed to deposit events*`,
      );
    });

    channel.bind('pusher:subscription_error', (error) => {
      console.error('Subscription error:', error);
    });

    // Bind to the deposit event
    pusherClient.bind('deposit', async (data) => {
      await this.bot.telegram.sendMessage(
        chatId,
        `💰 *New Deposit Received*\n\n` +
          `${data.amount} USDC deposited on Solana`,
      );
    });
  }
}
