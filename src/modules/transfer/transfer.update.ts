import { Action, Command, Ctx, InjectBot, On, Update } from 'nestjs-telegraf';
import { KeyboardsService } from '../shared/keyboard.service';
import { Context, Markup, Telegraf } from 'telegraf';
import { Actions } from 'src/enums/actions.enums';
import { TransferService } from './transfer.service';
import { SceneContext } from 'telegraf/typings/scenes';
import { EMAIL_TRANSFER_SCENE_ID } from './scenes/email-transfer.scene';
import { WALLET_TRANSFER_SCENE } from './scenes/wallet-transfer.scene';
import { RequireAuth } from '../auth/auth.decorator';
import { Commands } from 'src/enums/commands.enum';
import { handleErrorResponses } from 'src/utils';

@Update()
@RequireAuth()
export class TransferUpdate {
  constructor(
    @InjectBot() bot: Telegraf<Context>,
    private readonly keyboard: KeyboardsService,
    private readonly transferService: TransferService,
  ) {}

  @Action(Actions.TRANSFER)
  async handleTransferAction(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await this.transfer(ctx);
  }

  async transfer(ctx) {
    const keyboard = Markup.inlineKeyboard([
      // Money transfer options
      [
        Markup.button.callback('📧 Email Transfer', Actions.TRANSFER_TO_EMAIL),
        Markup.button.callback(
          '💳 Wallet Transfer',
          Actions.TRANSFER_TO_WALLET,
        ),
      ],
      [
        Markup.button.callback(
          '🏦 Bank Withdrawal',
          Actions.TRANSFER_TO_BANK_ACCOUNT,
        ),
      ],
      // Transaction history
      [Markup.button.callback('📊 Recent Transfers', Actions.TRANSFER_HISTORY)],
      // Navigation
      [Markup.button.callback('❌ Close', Actions.CLOSE)],
    ]);

    await ctx.replyWithMarkdownV2(
      '*📤 Transfer*\n\nPlease choose mode for transfer',
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
                  : '💼';

          // Determine emoji based on transaction status
          const statusEmoji =
            transaction.status === 'pending'
              ? '⏳'
              : transaction.status === 'completed'
                ? '✅'
                : transaction.status === 'failed'
                  ? '❌'
                  : '❓';

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
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage: 'Failed to fetch transactions',
        buttons: [{ text: '🔃 Retry', action: Actions.TRANSFER_HISTORY }],
      });
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

  @Command(Commands.TRANSFER)
  handleTransferCommand(@Ctx() ctx: SceneContext) {
    ctx.scene.enter(WALLET_TRANSFER_SCENE);
  }

  @Command(Commands.TRANSFER_TO_EMAIL)
  handleTransferToEmailCommand(@Ctx() ctx: SceneContext) {
    ctx.scene.enter(EMAIL_TRANSFER_SCENE_ID);
  }

  @Command(Commands.TRANSFER_TO_WALLET)
  handleTransferToWalletCommand(@Ctx() ctx: SceneContext) {
    ctx.scene.enter(WALLET_TRANSFER_SCENE);
  }

  @Command(Commands.TRANSFER_HISTORY)
  async handleTransferHistoryCommand(@Ctx() ctx: Context) {
    const [message] = await Promise.allSettled([
      ctx.reply('🔃 Fetching your transfer history'),
      this.viewTransactions(ctx),
    ]);

    if (message.status === 'fulfilled') {
      await ctx.deleteMessage(message.value.message_id);
    }
  }
}
