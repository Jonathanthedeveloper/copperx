import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { PayeeService } from '../payee.service';
import { isEmail } from 'class-validator';
import { Actions } from 'src/enums/actions.enums';
import { KeyboardsService } from 'src/modules/shared/keyboard.service';
import { RequireAuth } from 'src/modules/auth/auth.decorator';
import { escapeMarkdownV2 } from 'src/utils';

export const ADD_PAYEE_SCENE_ID = 'ADD_PAYEE_SCENE_ID';

enum AddPayeeActions {
  CLOSE = 'CLOSE',
  BACK = 'BACK',
  CONFIRM_PAYEE = 'CONFIRM_PAYEE',
  CANCEL = 'CANCEL',
}

@RequireAuth()
@Wizard(ADD_PAYEE_SCENE_ID)
export class AddPayee {
  constructor(
    private readonly payeeService: PayeeService,
    private readonly keyboard: KeyboardsService,
  ) {}

  @WizardStep(1)
  async askEmail(ctx: WizardContext) {
    if ((ctx.message as any)?.text) {
      // Check if it's a valid email
      if (!isEmail((ctx.message as any).text)) {
        await ctx.reply(
          '❌ Invalid email address. Please enter a valid email.',
        );
        return; // Stay in the same step
      }

      // Store email in wizard state
      // @ts-expect-error
      ctx.wizard.state.email = (ctx.message as any).text;

      // Ask for the payee's nickname
      await ctx.reply('👤 Please enter a nickname for the recipient:');
      ctx.wizard.next(); // Move to the next step after handling the email
      return;
    }

    const keyboard = Markup.inlineKeyboard([
      Markup.button.callback('❌ Cancel', AddPayeeActions.CLOSE),
    ]);

    await ctx.replyWithMarkdownV2("✉️ Please enter the recipient's email:", {
      reply_markup: keyboard.reply_markup,
    });
  }

  //   @WizardStep(2)
  async handleEmail(@Ctx() ctx: WizardContext) {
    console.log('HANDLING EMAIL', 2);
    const email = (ctx.message as any)?.text;

    // Validate email
    if (!isEmail(email)) {
      await ctx.reply('❌ Invalid email address. Please enter a valid email.');
      return; // Stay in the same step
    }

    // Store email in wizard state
    // @ts-expect-error
    ctx.wizard.state.email = email;

    // Ask for the payee's nickname
    await ctx.reply('👤 Please enter a nickname for this recipient:');
    ctx.wizard.next(); // Move to the next step after handling the email
  }

  @WizardStep(2)
  async handleNickname(@Ctx() ctx: WizardContext) {
    if (!(ctx.message as any)?.text) {
      await ctx.reply('👤 Please enter a nickname for the recipient:');
      return;
    }

    const nickname = (ctx.message as any)?.text;

    // Validate nickname
    if (!nickname || nickname.length < 2) {
      await ctx.reply('❌ Nickname must be at least 2 characters long.');
      return; // Stay in the same step
    }

    // Store nickname in wizard state
    // @ts-expect-error
    ctx.wizard.state.nickname = nickname;

    // Confirm the payee details
    const confirmKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Confirm', AddPayeeActions.CONFIRM_PAYEE)],
      [Markup.button.callback('❌ Cancel', AddPayeeActions.CANCEL)],
    ]);

    await ctx.replyWithMarkdownV2(
      `*Confirm Payee Details*\n\n` +
        // @ts-expect-error
        `✉️ *Email:* ${escapeMarkdownV2(ctx.wizard.state.email)}\n` +
        // @ts-expect-error
        `👤 *Nickname:* ${escapeMarkdownV2(ctx.wizard.state.nickname)}`,
      {
        reply_markup: confirmKeyboard.reply_markup,
      },
    );
  }

  @Action(AddPayeeActions.CONFIRM_PAYEE)
  async confirmPayee(@Ctx() ctx: WizardContext) {
    try {
      ctx.answerCbQuery('🔄 Adding Recipient...');
      // Create the payee using the PayeeService
      const payee = await this.payeeService.createPayee(
        // @ts-expect-error
        ctx.session.auth.access_token,
        {
          // @ts-expect-error
          email: ctx.wizard.state.email,
          // @ts-expect-error
          nickName: ctx.wizard.state.nickname,
        },
      );

      // Notify the user
      await ctx.replyWithMarkdownV2(
        `✅ Payee created successfully\\!\n\n` +
          `✉️ *Email:* ${escapeMarkdownV2(payee.email)}\n` +
          `👤 *Nickname:* ${escapeMarkdownV2(payee.nickName)}`,
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('❌ Close', AddPayeeActions.CLOSE)],
          ]).reply_markup,
        },
      );

      // Exit the scene
      ctx.scene.leave();
    } catch (error) {
      console.error('Error creating payee:', error);
      await ctx.reply('❌ Failed to create payee. Please try again.');
    }
  }

  @Action(AddPayeeActions.BACK)
  async back(ctx: WizardContext) {
    ctx.wizard.back(); // Go back to the previous step
  }

  @Action(AddPayeeActions.CLOSE)
  async close(ctx: WizardContext) {
    await ctx.deleteMessage(); // Delete the current message
    await ctx.scene.leave(); // Exit the scene
  }

  @Action(AddPayeeActions.CANCEL)
  async cancel(ctx: WizardContext) {
    ctx.answerCbQuery('🚫 Cancelling...');
    await ctx.replyWithMarkdownV2('❌ Payee creation cancelled\\.', {
      reply_markup: this.keyboard.getMainKeyboard().reply_markup,
    });
    await ctx.scene.leave();
  }
}
