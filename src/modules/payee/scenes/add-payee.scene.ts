import {
  Action,
  Command,
  Ctx,
  SceneEnter,
  Wizard,
  WizardStep,
} from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { PayeeService } from '../payee.service';
import { isEmail } from 'class-validator';
import { Actions } from 'src/enums/actions.enums';
import { KeyboardsService } from 'src/modules/shared/keyboard.service';
import { RequireAuth } from 'src/modules/auth/auth.decorator';
import { escapeMarkdownV2, handleErrorResponses } from 'src/utils';
import { Commands } from 'src/enums/commands.enum';

export const ADD_PAYEE_SCENE_ID = 'ADD_PAYEE_SCENE_ID';

enum AddPayeeActions {
  CLOSE = 'CLOSE',
  BACK = 'BACK',
  CONFIRM_PAYEE = 'CONFIRM_PAYEE',
  CANCEL = 'CANCEL',
  RETRY = 'RETRY',
}

@RequireAuth()
@Wizard(ADD_PAYEE_SCENE_ID)
export class AddPayee {
  constructor(
    private readonly payeeService: PayeeService,
    private readonly keyboard: KeyboardsService,
  ) {}

  @SceneEnter()
  async askEmail(@Ctx() ctx: Context) {
    await ctx.replyWithMarkdownV2("✉️ Please enter the recipient's email:", {
      reply_markup: Markup.inlineKeyboard([
        Markup.button.callback('🚫 Cancel', AddPayeeActions.CANCEL),
      ]).reply_markup,
    });
  }

  @WizardStep(1)
  async handleEmail(@Ctx() ctx: WizardContext) {
    const email = (ctx.message as any)?.text;

    // Validate email
    if (!isEmail(email)) {
      await ctx.replyWithMarkdownV2(
        '❌ Invalid email address\\. Please enter a valid email\\.',
        {
          reply_markup: Markup.inlineKeyboard([
            Markup.button.callback('🚫 Cancel', AddPayeeActions.CANCEL),
          ]).reply_markup,
        },
      );
      return; // Stay in the same step
    }

    // Store email in wizard state
    // @ts-expect-error
    ctx.wizard.state.email = email;

    // Ask for the payee's nickname
    await ctx.replyWithMarkdownV2(
      '👤 Please enter a nickname for the recipient:',
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback('🚫 Cancel', AddPayeeActions.CANCEL),
        ]).reply_markup,
      },
    );

    ctx.wizard.next();
  }

  @WizardStep(2)
  async handleNickname(@Ctx() ctx: WizardContext) {
    const nickname = (ctx.message as any)?.text;

    // Validate nickname
    if (!nickname || nickname.length < 2) {
      await ctx.replyWithMarkdownV2(
        '❌ Nickname must be at least 2 characters long\\.',
        {
          reply_markup: Markup.inlineKeyboard([
            Markup.button.callback('🚫 Cancel', AddPayeeActions.CANCEL),
          ]).reply_markup,
        },
      );
      return; // Stay in the same step
    }

    // Store nickname in wizard state
    // @ts-expect-error
    ctx.wizard.state.nickname = nickname;

    // Ask for the wallet address
    await ctx.replyWithMarkdownV2(
      "💳 Please enter the recipient's wallet address:",
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback('🚫 Cancel', AddPayeeActions.CANCEL),
        ]).reply_markup,
      },
    );

    ctx.wizard.next();
  }

  @WizardStep(3)
  async handleWalletAddress(@Ctx() ctx: WizardContext) {
    const walletAddress = (ctx.message as any)?.text;

    // Validate wallet address (add your validation logic here)
    if (!walletAddress || walletAddress.length < 10) {
      await ctx.replyWithMarkdownV2(
        '❌ Invalid wallet address\\. Please enter a valid address\\.',
        {
          reply_markup: Markup.inlineKeyboard([
            Markup.button.callback('🚫 Cancel', AddPayeeActions.CANCEL),
          ]).reply_markup,
        },
      );
      return; // Stay in the same step
    }

    // Store wallet address in wizard state
    // @ts-expect-error
    ctx.wizard.state.walletAddress = walletAddress;

    // Confirm the payee details
    const confirmKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Confirm', AddPayeeActions.CONFIRM_PAYEE)],
      [Markup.button.callback('🚫 Cancel', AddPayeeActions.CANCEL)],
    ]);

    await ctx.replyWithMarkdownV2(
      `*Confirm Payee Details*\n\n` +
        // @ts-expect-error
        `✉️ *Email:* ${escapeMarkdownV2(ctx.wizard.state.email)}\n` +
        // @ts-expect-error
        `👤 *Nickname:* ${escapeMarkdownV2(ctx.wizard.state.nickname)}\n` +
        // @ts-expect-error
        `💳 *Wallet Address:* ${escapeMarkdownV2(ctx.wizard.state.walletAddress)}`,
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
          // @ts-expect-error
          walletAddress: ctx.wizard.state.walletAddress,
        },
      );

      // Notify the user
      await ctx.replyWithMarkdownV2(
        `✅ Recipient added successfully\\!\n\n` +
          `✉️ *Email:* ${escapeMarkdownV2(payee.email)}\n` +
          `👤 *Nickname:* ${escapeMarkdownV2(payee.nickName)}\n`,
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('◀️ Main Menu', Actions.MAIN_MENU)],
            [Markup.button.callback('❌ Close', AddPayeeActions.CLOSE)],
          ]).reply_markup,
        },
      );

      // Exit the scene
      ctx.scene.leave();
    } catch (error) {
      await handleErrorResponses({
        error,
        ctx,
        defaultMessage: '❌ Failed to create payee\\. Please try again\\.',
        buttons: [{ text: '🔃 Retry', action: AddPayeeActions.CONFIRM_PAYEE }],
      });
    }
  }

  @Action(AddPayeeActions.BACK)
  async back(ctx: WizardContext) {
    ctx.wizard.back();
  }

  @Action(AddPayeeActions.CLOSE)
  async close(ctx: WizardContext) {
    await ctx.deleteMessage();
    await ctx.scene.leave();
  }

  @Action(AddPayeeActions.CANCEL)
  async onCancel(ctx: WizardContext) {
    ctx.answerCbQuery('🚫 Cancelling...');
    await ctx.replyWithMarkdownV2('❌ Add Recipient cancelled\\.', {
      reply_markup: this.keyboard.getMainKeyboard().reply_markup,
    });
    await ctx.scene.leave();
  }

  @Command(Commands.Cancel)
  async cancel(@Ctx() ctx: WizardContext) {
    await ctx.scene.leave();
  }
}
