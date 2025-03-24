import { Action, Command, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { PayeeService } from '../payee.service';
import { Actions } from 'src/enums/actions.enums';
import { KeyboardsService } from 'src/modules/shared/keyboard.service';
import { escapeMarkdownV2, handleErrorResponses } from 'src/utils';
import { RequireAuth } from 'src/modules/auth/auth.decorator';
import { Commands } from 'src/enums/commands.enum';

export const REMOVE_PAYEE_SCENE_ID = 'REMOVE_PAYEE_SCENE_ID';

enum RemovePayeeActions {
  CLOSE = 'CLOSE',
  BACK = 'BACK',
  CANCEL = 'CANCEL',
  CONFIRM = 'CONFIRM',
  ADD_PAYEE = 'ADD_PAYEE',
  RETRY = 'RETRY',
}

@Wizard(REMOVE_PAYEE_SCENE_ID)
@RequireAuth()
export class RemovePayee {
  constructor(
    private readonly payeeService: PayeeService,
    private readonly keyboard: KeyboardsService,
  ) {}

  @WizardStep(1)
  async selectPayee(@Ctx() ctx: WizardContext) {
    // @ts-expect-error
    const accessToken = ctx.session.auth?.access_token ?? '';

    try {
      // Fetch all payees
      const payeesResponse = await this.payeeService.getAllPayees(accessToken);
      const payees = payeesResponse.data;

      if (payees.length === 0) {
        await ctx.replyWithMarkdownV2(
          '❌ No recipients found\\. Please add a recipient first\\.',
          {
            reply_markup: Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  '➕ Add Recipient',
                  RemovePayeeActions.ADD_PAYEE,
                ),
              ],
              [Markup.button.callback('❌ Close', RemovePayeeActions.CLOSE)],
            ]).reply_markup,
          },
        );
        ctx.scene.leave();
        return;
      }

      // Create a list of payees for the user to select
      const payeeButtons = payees.map((payee) =>
        Markup.button.callback(
          `${payee.nickName || payee.displayName} (${payee.email})`,
          `SELECT_PAYEE_${payee.id}`,
        ),
      );

      // Add a cancel button
      payeeButtons.push(
        Markup.button.callback('🚫 Cancel', RemovePayeeActions.CANCEL),
      );

      // Display the list of payees
      await ctx.replyWithMarkdownV2(
        '🗑️ Remove *Recipient*\n\n👤 *Select a recipient to remove:*',
        {
          reply_markup: Markup.inlineKeyboard(payeeButtons, { columns: 1 })
            .reply_markup,
        },
      );
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage: 'Failed to fetch recipients',
        buttons: [{ text: '🔃 Retry', action: RemovePayeeActions.RETRY }],
      });
    }
  }

  @Action(/^SELECT_PAYEE_/)
  async onPayeeSelected(ctx: WizardContext) {
    // Extract the payee ID from the callback data
    // @ts-expect-error
    const payeeId = ctx.callbackQuery.data.replace('SELECT_PAYEE_', '');
    // @ts-expect-error
    const accessToken = ctx.session.auth?.access_token ?? '';

    try {
      // Fetch the selected payee
      const payee = await this.payeeService.getPayeeById(accessToken, payeeId);

      // Store the selected payee in the wizard state
      // @ts-expect-error
      ctx.wizard.state.selectedPayee = payee;

      // Ask for confirmation
      await ctx.replyWithMarkdownV2(
        `⚠️ Are you sure you want to remove *${escapeMarkdownV2(
          // @ts-expect-error
          ctx.wizard.state.selectedPayee.nickName ||
            //    @ts-expect-error
            ctx.wizard.state.selectedPayee.displayName,
        )}*?`,
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('✅ Confirm', RemovePayeeActions.CONFIRM)],
            [Markup.button.callback('🚫 Cancel', RemovePayeeActions.CANCEL)],
          ]).reply_markup,
        },
      );
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage: 'Failed to fetch payee',
        buttons: [{ text: '🔃 Retry', action: RemovePayeeActions.RETRY }],
      });
      ctx.scene.leave();
    }
  }

  @Action(RemovePayeeActions.CONFIRM)
  async confirmRemove(@Ctx() ctx: WizardContext) {
    // @ts-expect-error
    if (!ctx.wizard.state?.selectedPayee) {
      await ctx.replyWithMarkdownV2(
        '❌ No payee selected\\. Please try again\\.',
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🚫 Cancel', RemovePayeeActions.CANCEL)],
          ]).reply_markup,
        },
      );

      ctx.scene.leave();
      return;
    }

    // @ts-expect-error
    const accessToken = ctx.session.auth?.access_token ?? '';

    try {
      // Delete the selected payee
      await this.payeeService.deletePayee(
        accessToken,
        // @ts-expect-error
        ctx.wizard.state.selectedPayee?.id,
      );

      // Notify the user
      await ctx.replyWithMarkdownV2(
        `✅ *${escapeMarkdownV2(
          // @ts-expect-error
          ctx.wizard.state.selectedPayee.nickName ||
            // @ts-expect-error
            ctx.wizard.state.selectedPayee.displayName,
        )}* has been removed successfully\\.`,
        {
          reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        },
      );
      ctx.scene.leave();
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage: 'Failed to remove payee',
        buttons: [{ text: '🔃 Retry', action: RemovePayeeActions.RETRY }],
      });
    }
  }

  @Action(RemovePayeeActions.BACK)
  async back(ctx: WizardContext) {
    ctx.wizard.back();
  }

  @Action(RemovePayeeActions.CLOSE)
  async close(@Ctx() ctx: WizardContext) {
    await ctx.deleteMessage();
    await ctx.scene.leave();
  }

  @Action(RemovePayeeActions.RETRY)
  async retry(@Ctx() ctx: WizardContext) {
    ctx.answerCbQuery('🔃 Retrying...');
    await ctx.scene.reenter();
  }

  @Action(RemovePayeeActions.CANCEL)
  async onCancel(@Ctx() ctx: WizardContext) {
    ctx.answerCbQuery('🚫 Cancelling...');
    await ctx.replyWithMarkdownV2('❌ Recipient removal cancelled\\.', {
      reply_markup: this.keyboard.getMainKeyboard().reply_markup,
    });
    await ctx.scene.leave();
  }

  @Command(Commands.Cancel)
  async cancel(@Ctx() ctx: WizardContext) {
    await ctx.scene.leave();
  }
}
