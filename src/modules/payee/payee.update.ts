import { Action, Update } from 'nestjs-telegraf';
import { PayeeService } from './payee.service';
import { Actions } from 'src/enums/actions.enums';
import { Context, Markup } from 'telegraf';
import { SceneContext, WizardContext } from 'telegraf/typings/scenes';
import { ADD_PAYEE_SCENE_ID } from './scenes/add-payee.scene';
import { REMOVE_PAYEE_SCENE_ID } from './scenes/remove-payee.scene';
import { RequireAuth } from '../auth/auth.decorator';

@Update()
@RequireAuth()
export class PayeeUpdate {
  constructor(private readonly payeeService: PayeeService) {}

  @Action(Actions.PAYEE)
  async showAllPayees(ctx: Context) {
    ctx.answerCbQuery('🔃 Fetching Payees');
    const payees = await this.payeeService.getAllPayees(
      ctx.session.auth?.access_token ?? '',
    );

    if (payees.data.length === 0) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('➕ Add Recipient', Actions.ADD_PAYEE)],
        [Markup.button.callback('❌ Close', Actions.CLOSE)],
      ]);
      await ctx.replyWithMarkdownV2('No payees found\\.', {
        reply_markup: keyboard.reply_markup,
      });

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
          `*${(index + 1).toString().replace(/[._-]/g, '\\$&')}\\. ${(
            payee.displayName || payee.nickName
          ).replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')}*\n` +
          `✉️ *Email:* ${payee.email.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')}\n` +
          `📞 *Phone:* ${(payee.phoneNumber || 'N/A').replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')}\n` +
          `🏦 *Bank Account:* ${payee.hasBankAccount ? '✅' : '❌'}\n\n`,
      )
      .join('\n');

    const message = `*📋 Payees*\n\n${payeeList}`;

    await ctx.replyWithMarkdownV2(message, {
      reply_markup: keyboard.reply_markup,
    });
  }

  @Action(Actions.ADD_PAYEE)
  async addPayee(ctx: SceneContext) {
    ctx.scene.enter(ADD_PAYEE_SCENE_ID);
  }

  @Action(Actions.REMOVE_PAYEE)
  async removePayee(ctx: SceneContext) {
    ctx.scene.enter(REMOVE_PAYEE_SCENE_ID);
  }
}
