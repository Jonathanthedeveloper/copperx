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
        `✅ Successfully subscribed to deposit notifications!\n\n📥 You will now receive real-time alerts whenever a new deposit is made to your account.`,
      );
    });

    channel.bind('pusher:subscription_error', (error) => {
      this.bot.telegram.sendMessage(
        chatId,
        `❌ Failed to subscribe to deposit notifications`,
      );
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
