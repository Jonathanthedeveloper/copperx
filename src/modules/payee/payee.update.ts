import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { PayeeService } from './payee.service';
import { Actions } from 'src/enums/actions.enums';
import { Context, Markup } from 'telegraf';
import { SceneContext, WizardContext } from 'telegraf/typings/scenes';
import { ADD_PAYEE_SCENE_ID } from './scenes/add-payee.scene';
import { REMOVE_PAYEE_SCENE_ID } from './scenes/remove-payee.scene';
import { RequireAuth } from '../auth/auth.decorator';
import { escapeMarkdownV2, handleErrorResponses } from 'src/utils';
import { Commands } from 'src/enums/commands.enum';

@Update()
@RequireAuth()
export class PayeeUpdate {
  constructor(private readonly payeeService: PayeeService) {}

  @Action(Actions.PAYEE)
  async showAllPayees(@Ctx() ctx: Context) {
    ctx.answerCbQuery('🔃 Fetching Recipients');
    await this.fetchPayees(ctx);
  }

  @Action(Actions.ADD_PAYEE)
  async addPayee(@Ctx() ctx: SceneContext) {
    ctx.answerCbQuery();
    ctx.scene.enter(ADD_PAYEE_SCENE_ID);
  }

  @Action(Actions.REMOVE_PAYEE)
  async removePayee(@Ctx() ctx: SceneContext) {
    ctx.scene.enter(REMOVE_PAYEE_SCENE_ID);
  }

  @Command(Commands.PAYEE)
  async showAllPayeesCommand(ctx: Context) {
    const [message] = await Promise.allSettled([
      ctx.reply('🔃 Fetching Recipients'),
      this.fetchPayees(ctx),
    ]);
    if (message.status === 'fulfilled') {
      await ctx.deleteMessage(message.value.message_id);
    }
  }

  @Command(Commands.ADD_PAYEE)
  async addPayeeCommand(ctx: WizardContext) {
    ctx.scene.enter(ADD_PAYEE_SCENE_ID);
  }

  @Command(Commands.REMOVE_PAYEE)
  async removePayeeCommand(ctx: WizardContext) {
    const [message] = await Promise.allSettled([
      ctx.reply('🔃 Fetching Available recipients'),
      ctx.scene.enter(REMOVE_PAYEE_SCENE_ID),
    ]);

    if (message.status === 'fulfilled') {
      await ctx.deleteMessage(message.value.message_id);
    }
  }

  async fetchPayees(ctx: Context) {
    try {
      const payees = await this.payeeService.getAllPayees(
        ctx.session.auth?.access_token ?? '',
      );

      if (payees.data.length === 0) {
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('➕ Add Recipient', Actions.ADD_PAYEE)],
          [Markup.button.callback('❌ Close', Actions.CLOSE)],
        ]);
        await ctx.replyWithMarkdownV2(
          '🛑 No Recipients Found\n\nDo you want to add one\\?',
          {
            reply_markup: keyboard.reply_markup,
          },
        );

        return;
      }

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('➕ Add Recipient', Actions.ADD_PAYEE),
          Markup.button.callback('➖ Remove Recipient', Actions.REMOVE_PAYEE),
        ],
        [Markup.button.callback('🔃 Refresh', Actions.PAYEE)],
        [Markup.button.callback('❌ Close', Actions.CLOSE)],
      ]);

      const payeeList = payees.data
        .map(
          (payee, index) =>
            `*${escapeMarkdownV2((index + 1).toString())}\\. ${escapeMarkdownV2(
              payee.displayName || payee.nickName,
            )}*\n` +
            `✉️ *Email:* ${escapeMarkdownV2(payee.email)}\n` +
            `📞 *Phone:* ${escapeMarkdownV2(payee.phoneNumber || 'N/A')}\n` +
            `🏦 *Bank Account:* ${payee.hasBankAccount ? '✅' : '❌'}\n\n`,
        )
        .join('\n');

      const message = `*📋 Payees*\n\n${payeeList}`;

      await ctx.replyWithMarkdownV2(message, {
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage: 'Failed to fetch recipients',
        buttons: [{ text: '🔃 Retry', action: Actions.PAYEE }],
      });
    }
  }
}
