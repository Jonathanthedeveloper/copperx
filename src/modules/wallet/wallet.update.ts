import { Action, Ctx, InjectBot, Update } from 'nestjs-telegraf';
import { KeyboardsService } from '../shared/keyboard.service';
import { Context, Telegraf } from 'telegraf';
import { WalletService } from './wallet.service';
import { Actions } from 'src/enums/actions.enums';
import { RequireAuth } from '../auth/auth.decorator';

@Update()
@RequireAuth()
export class WalletUpdate {
  constructor(
    @InjectBot() bot: Telegraf<Context>,
    private readonly keyboard: KeyboardsService,
    private readonly walletService: WalletService,
  ) {}

  @Action('WALLET')
  async wallet(@Ctx() ctx: Context) {
    try {
      // Check if user is logged in
      if (!ctx.session.auth?.access_token) {
        const keyboard = this.keyboard.getUnauthenticatedKeyboard();
        await ctx.replyWithMarkdownV2(
          'You are not logged in\\. Please login first\\.',
          {
            reply_markup: keyboard.reply_markup,
          },
        );
        return;
      }

      ctx.answerCbQuery('🔃 Fetching Wallets');

      // Fetch wallets and balances
      const wallets = await this.walletService.getWallets(
        ctx.session.auth?.access_token ?? '',
      );
      const balances = await this.walletService.getBalances(
        ctx.session.auth.access_token,
      );

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
      const keyboard = this.keyboard.getWalletKeyboard();

      // Send the message with the inline keyboard
      await ctx.replyWithMarkdownV2(walletMessage, {
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      console.error(error);
      await ctx.reply('An error occurred while fetching wallets');
    }
  }

  @Action(Actions.SET_DEFAULT_WALLET)
  async setDefaultWallet(@Ctx() ctx: Context) {
    try {
      // Check if user is logged in
      if (!ctx.session.auth?.access_token) {
        const keyboard = this.keyboard.getUnauthenticatedKeyboard();
        await ctx.replyWithMarkdownV2(
          'You are not logged in\\. Please login first\\.',
          {
            reply_markup: keyboard.reply_markup,
          },
        );
        return;
      }

      // Fetch all wallets
      const wallets = await this.walletService.getWallets(
        ctx.session.auth.access_token,
      );

      // Create a keyboard with wallet addresses
      const keyboard = this.keyboard.getWalletSelectionKeyboard(wallets);

      // Send the message with the inline keyboard
      await ctx.replyWithMarkdownV2('Select a wallet to set as default:', {
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      console.error(error);
      await ctx.reply('An error occurred while fetching wallets');
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
      await ctx.reply('✅ Default wallet updated successfully!');

      // Refresh the wallet list
      await this.wallet(ctx);
    } catch (error) {
      console.error(error);
      await ctx.reply('Failed to set default wallet. Please try again.');
    }
  }
}
