import { Action, Ctx, InjectBot, On, Update } from 'nestjs-telegraf';
import { KeyboardsService } from '../shared/keyboard.service';
import { Context, Telegraf } from 'telegraf';
import { Actions } from 'src/enums/actions.enums';
import { TransferService } from './transfer.service';
import { SceneContext } from 'telegraf/typings/scenes';
import { EMAIL_TRANSFER_SCENE_ID } from './scenes/email-transfer.scene';
import { WALLET_TRANSFER_SCENE } from './scenes/wallet-transfer.scene';
import { RequireAuth } from '../auth/auth.decorator';

@Update()
@RequireAuth()
export class TransferUpdate {
  constructor(
    @InjectBot() bot: Telegraf<Context>,
    private readonly keyboard: KeyboardsService,
    private readonly transferService: TransferService,
  ) {}

  @Action(Actions.TRANSFER)
  async transfer(@Ctx() ctx: Context) {
    const keyboard = this.keyboard.getFundTransferKeyboard();

    await ctx.replyWithMarkdownV2(
      '*↗️ Transfer*\n\nPlease choose mode for transfer',
      {
        reply_markup: keyboard.reply_markup,
      },
    );
  }

  @Action(Actions.TRANSFER_HISTORY)
  async viewTransactions(@Ctx() ctx: Context) {
    try {
      const transactions = await this.transferService.getTransferHistory(
        ctx.session.auth?.access_token ?? '',
      );

      const message = transactions.data
        .map((transaction) => {
          // Determine emoji based on transaction type
          const typeEmoji =
            transaction.type === 'send'
              ? '📤'
              : transaction.type === 'receive'
                ? '📥'
                : transaction.type === 'withdraw'
                  ? '🏧'
                  : '💼'; // Default emoji

          // Determine emoji based on transaction status
          const statusEmoji =
            transaction.status === 'pending'
              ? '⏳'
              : transaction.status === 'completed'
                ? '✅'
                : transaction.status === 'failed'
                  ? '❌'
                  : '❓'; // Default emoji

          return (
            `${typeEmoji} *${transaction.type.toUpperCase()}*\n` +
            `   💸 *Amount:* ${transaction.amount} ${transaction.currency}\n` +
            `   📅 *Date:* ${new Date(transaction.createdAt).toLocaleString()}\n` +
            `   🔄 *Status:* ${statusEmoji} ${transaction.status}\n` +
            `   ---`
          );
        })
        .join('\n');

      await ctx.replyWithMarkdownV2(`*📜 Transactions*\n\n${message}`);
    } catch (error) {
      console.error(error);
      await ctx.reply('Failed to fetch transactions. Please try again.');
    }
  }

  @Action(Actions.TRANSFER_TO_EMAIL)
  async transferToEmail(@Ctx() ctx: SceneContext) {
    await ctx.answerCbQuery();
    ctx.scene.enter(EMAIL_TRANSFER_SCENE_ID);
  }

  @Action(Actions.TRANSFER_TO_WALLET)
  async transferToWallet(@Ctx() ctx: SceneContext) {
    await ctx.answerCbQuery();
    ctx.scene.enter(WALLET_TRANSFER_SCENE);
  }
}
