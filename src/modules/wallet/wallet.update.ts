import { Action, Command, Ctx, InjectBot, Update } from 'nestjs-telegraf';
import { KeyboardsService } from '../shared/keyboard.service';
import { Context, Markup, Telegraf } from 'telegraf';
import { WalletService } from './wallet.service';
import { Actions } from 'src/enums/actions.enums';
import { RequireAuth } from '../auth/auth.decorator';
import { handleErrorResponses } from 'src/utils';
import { Commands } from 'src/enums/commands.enum';

@Update()
@RequireAuth()
export class WalletUpdate {
  constructor(
    @InjectBot() bot: Telegraf<Context>,
    private readonly keyboard: KeyboardsService,
    private readonly walletService: WalletService,
  ) {}

  @Command(Commands.WALLET)
  async handleWalletCommand(@Ctx() ctx: Context) {
    const [message] = await Promise.allSettled([
      ctx.reply('🔃 Fetching Wallets...'),
      this.wallet(ctx),
    ]);

    if (message.status === 'fulfilled') {
      await ctx.deleteMessage(message.value.message_id);
    }
  }

  @Action(Actions.WALLET)
  async handleWalletAction(@Ctx() ctx: Context) {
    ctx.answerCbQuery('🔃 Fetching Wallets...');
    await this.wallet(ctx);
  }

  @Command(Commands.SET_DEFAULT_WALLET)
  async handleSetDefaultWalletCommand(@Ctx() ctx: Context) {
    await this.setDefaultWallet(ctx);
  }

  async wallet(@Ctx() ctx: Context) {
    try {
      const [wallets, balances] = await Promise.all([
        this.walletService.getWallets(ctx.session.auth?.access_token ?? ''),
        this.walletService.getBalances(ctx.session.auth?.access_token ?? ''),
      ]);

      // Format the wallet message
      const walletMessage = [
        '*Your Wallets* 👜\n\n',
        wallets
          .map((wallet) => {
            const walletBalance = balances.find(
              (b) => b.walletId === wallet.id,
            );
            const balanceText = walletBalance
              ? walletBalance.balances
                  .map(
                    (balance) =>
                      `   \\- ${balance.symbol}: ${balance.balance}\n`,
                  )
                  .join('')
              : '   - No balances found\n';
            return (
              `🔐 *${wallet.walletType}* ${wallet.isDefault ? '\\(Default\\)' : ''}\n` +
              `📌 Address: \`${wallet.walletAddress}\`\n` +
              `🌐 Network: ${this.walletService.networks[wallet.network]}\n` +
              `💰 Balances:\n${balanceText}`
            );
          })
          .join('\n'),
      ].join('');

      // Get the wallet keyboard
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            'Set Default Wallet',
            Actions.SET_DEFAULT_WALLET,
          ),
        ],
        [Markup.button.callback('🔄 Refresh', Actions.WALLET)],
        [Markup.button.callback('❌ Close', Actions.CLOSE)],
      ]);

      // Send the message with the inline keyboard
      await ctx.replyWithMarkdownV2(walletMessage, {
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      await handleErrorResponses({
        error,
        ctx,
        defaultMessage: 'Failed to fetch wallets',
        buttons: [{ text: '🔃 Retry', action: Actions.WALLET }],
      });
    }
  }

  @Action(Actions.SET_DEFAULT_WALLET)
  async setDefaultWalletAction(@Ctx() ctx: Context) {
    ctx.answerCbQuery();
    await this.setDefaultWallet(ctx);
  }
  async setDefaultWallet(ctx) {
    try {
      // Fetch all wallets
      const wallets = await this.walletService.getWallets(
        ctx.session.auth?.access_token ?? '',
      );

      // Create a keyboard with wallet addresses
      const keyboard = this.keyboard.getWalletSelectionKeyboard(wallets);

      // Send the message with the inline keyboard
      await ctx.replyWithMarkdownV2('Select a wallet to set as default:', {
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage: 'Failed to fetch wallets',
        buttons: [{ text: '🔃 Retry', action: Actions.SET_DEFAULT_WALLET }],
        prefix: '🔐',
        header: 'Set Default Wallet',
      });
    }
  }

  @Action(/set_default_wallet_(.*)/)
  async handleWalletSelection(@Ctx() ctx: Context) {
    try {
      ctx.answerCbQuery('🔃 Setting Default Wallet');

      // Extract walletId from the callback data
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const walletId = (ctx as any).match[1];

      // Set the selected wallet as default
      await this.walletService.setDefaultWallet(
        ctx.session.auth?.access_token ?? '',
        walletId,
      );

      // Confirm to the user
      await ctx.replyWithMarkdownV2(
        '✅ Default wallet updated successfully\\!',
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Refresh', Actions.WALLET)],
            [Markup.button.callback('❌ Close', Actions.CLOSE)],
          ]).reply_markup,
        },
      );

      // Refresh the wallet list
      await this.wallet(ctx);
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage: 'Failed to set default wallet',
        buttons: [{ text: '🔃 Retry', action: Actions.SET_DEFAULT_WALLET }],
        prefix: '🔐',
        header: 'Set Default Wallet',
      });
    }
  }
}
