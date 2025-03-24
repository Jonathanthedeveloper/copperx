import { Action, Command, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { TransferService } from '../transfer.service';
import { KeyboardsService } from 'src/modules/shared/keyboard.service';
import { PayeeService } from 'src/modules/payee/payee.service';
import { ADD_PAYEE_SCENE_ID } from 'src/modules/payee/scenes/add-payee.scene';
import { Payee, PurposeCode } from 'src/types';
import { RequireAuth } from 'src/modules/auth/auth.decorator';
import { escapeMarkdownV2, handleErrorResponses } from 'src/utils';
import { Commands } from 'src/enums/commands.enum';

// Define the scene ID
export const EMAIL_TRANSFER_SCENE_ID = 'EMAIL_TRANSFER_SCENE';

enum EmailTransferActions {
  BACK = 'BACK',
  CANCEL = 'CANCEL',
  CLOSE = 'CLOSE',
  ADD_PAYEE = 'ADD_PAYEE',
  CONFIRM_TRANSFER = 'CONFIRM_TRANSFER',
}

@Wizard(EMAIL_TRANSFER_SCENE_ID)
@RequireAuth()
export class EmailTransfer {
  constructor(
    private readonly transferService: TransferService,
    private readonly keyboard: KeyboardsService,
    private readonly payeeService: PayeeService,
  ) {}

  @WizardStep(1)
  async askPayee(ctx: WizardContext) {
    try {
      // Fetch the list of payees
      const payees = await this.payeeService.getAllPayees(
        // @ts-expect-error
        ctx.session.auth?.access_token ?? '',
      );

      if (payees.data.length === 0) {
        // If no payees found, show a message and offer to add a payee
        const keyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback(
              '➕ Add Recipient',
              EmailTransferActions.ADD_PAYEE,
            ),
          ],
          [Markup.button.callback('🚫 Cancel', EmailTransferActions.CANCEL)],
        ]);
        await ctx.replyWithMarkdownV2(
          'No Recipients found\\. Please add a recipient before continuing\\.',
          {
            reply_markup: keyboard.reply_markup,
          },
        );
        return;
      }

      // Create buttons for each payee
      const payeeButtons = payees.data.map((payee) => [
        Markup.button.callback(
          `${payee.displayName || payee.nickName} \(${payee.email}\)`,
          `PAYEE:${payee.id}`,
        ),
      ]);

      // Add navigation buttons at the bottom
      payeeButtons.push([
        Markup.button.callback('🚫 Cancel', EmailTransferActions.CANCEL),
      ]);

      await ctx.replyWithMarkdownV2('Please select a recipient:', {
        reply_markup: Markup.inlineKeyboard(payeeButtons).reply_markup,
      });

      ctx.wizard.next();
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage: 'Failed to fetch recipients',
      });
    }
  }

  @Action(/^PAYEE:(.+)$/)
  async handlePayeeSelection(ctx: WizardContext) {
    try {
      // Extract the payee ID from callback data
      const payeeId =
        (ctx.callbackQuery as { data: string })?.data?.split(':')[1] || '';

      const accessToken = (ctx.session as any).auth?.access_token;

      const payee = await this.payeeService.getPayeeById(accessToken, payeeId);

      if (!payee) {
        ctx.replyWithMarkdownV2('Invalid Payee Selected', {
          reply_markup: Markup.inlineKeyboard([
            Markup.button.callback(
              '🚫 Cancel Transfer',
              EmailTransferActions.CANCEL,
            ),
          ]).reply_markup,
        });
      }

      // Store the payee ID in wizard state
      // @ts-expect-error
      ctx.wizard.state.payee = payee;

      // Acknowledge the selection
      await ctx.answerCbQuery(`Selected recipient: ${payeeId}`);

      const keyboard = Markup.inlineKeyboard([
        Markup.button.callback('🚫 Cancel', EmailTransferActions.CANCEL),
      ]);

      // Ask for the amount to transfer
      await ctx.replyWithMarkdownV2(
        'Please enter the amount \\(USDT\\) you want to transfer:',
        {
          reply_markup: keyboard.reply_markup,
        },
      );

      ctx.wizard.next();
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage: 'Failed to fetch recipient info',
      });
    }
  }

  @WizardStep(2)
  async askAmount(ctx: WizardContext) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('◀️ Back', EmailTransferActions.BACK)],
      [Markup.button.callback('🚫 Cancel', EmailTransferActions.CANCEL)],
    ]);

    // Receive and validate the amount
    if (!(ctx.message as { text: string })?.text) {
      await ctx.replyWithMarkdownV2('Please enter a valid amount \\(USDT\\):', {
        reply_markup: keyboard.reply_markup,
      });
      return;
    }

    const amount = parseFloat((ctx.message as { text: string }).text);

    // Validate the amount
    if (isNaN(amount)) {
      await ctx.replyWithMarkdownV2('Please enter a valid amount \\(USDT\\):', {
        reply_markup: keyboard.reply_markup,
      });
      return;
    }

    if (amount <= 0) {
      await ctx.replyWithMarkdownV2('Please enter a valid amount in USDT', {
        reply_markup: keyboard.reply_markup,
      });
      return;
    }

    // Save the amount to the context
    // @ts-expect-error
    ctx.wizard.state.amount = amount;

    // Ask for the purpose of the transfer
    const purposeButtons = this.transferService.purposeCodes.map((code) =>
      Markup.button.callback(code.label, `PURPOSE:${code.value}`),
    );

    // Arrange buttons in rows of 2 for better display
    const buttonRows = purposeButtons.reduce(
      (rows, button, index) => {
        if (index % 2 === 0) rows.push([button]);
        else rows[rows.length - 1].push(button);
        return rows;
      },
      [] as ReturnType<typeof Markup.button.callback>[][],
    );

    // Add navigation buttons at the bottom
    buttonRows.push([
      Markup.button.callback('◀️ Back', EmailTransferActions.BACK),
    ]);
    buttonRows.push([
      Markup.button.callback('🚫 Cancel', EmailTransferActions.CANCEL),
    ]);

    await ctx.replyWithMarkdownV2(
      'Please select the purpose of the transfer:',
      {
        reply_markup: Markup.inlineKeyboard(buttonRows).reply_markup,
      },
    );

    ctx.wizard.next();
  }

  @Action(/^PURPOSE:(.+)$/)
  async handlePurposeSelection(ctx: WizardContext) {
    // Extract the purpose value from callback data
    const purposeValue =
      (ctx.callbackQuery as { data: string })?.data?.split(':')[1] || '';
    const purpose = this.transferService.purposeCodes.find(
      (p) => p.value === purposeValue,
    );

    if (!purpose) {
      await ctx.answerCbQuery('Invalid selection');
      return;
    }

    // Store the purpose in wizard state
    // @ts-expect-error
    ctx.wizard.state.purpose = purpose;

    // Acknowledge the selection
    ctx.answerCbQuery(`Selected: ${purpose.label}`);

    // Confirm the transfer details
    await this.confirmTransfer(ctx);
  }

  async confirmTransfer(ctx: WizardContext) {
    const { payee, amount, purpose } = ctx.wizard.state as {
      payee: Payee;
      amount: number;
      purpose: {
        label: string;
        value: string;
      };
    };

    const confirmKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          '✅ Confirm',
          EmailTransferActions.CONFIRM_TRANSFER,
        ),
      ],
      [Markup.button.callback('◀️ Back', EmailTransferActions.BACK)],
      [Markup.button.callback('🚫 Cancel', EmailTransferActions.CANCEL)],
    ]);

    await ctx.replyWithMarkdownV2(
      `*Confirm Transfer Details*\n\n` +
        `👤 *Payee:* ${escapeMarkdownV2(payee.nickName || payee.displayName)} \\(${escapeMarkdownV2(payee.email)}\\)\n` +
        `💸 *Amount:* ${escapeMarkdownV2(amount.toString())} USD\n` +
        `📝 *Purpose:* ${escapeMarkdownV2(purpose.label)}`,
      {
        reply_markup: confirmKeyboard.reply_markup,
      },
    );
  }

  @Action(EmailTransferActions.CONFIRM_TRANSFER)
  async handleConfirmTransfer(ctx: WizardContext) {
    ctx.answerCbQuery('🔃 Processing your transfer');
    try {
      const { payee, amount, purpose } = ctx.wizard.state as {
        payee: Payee;
        amount: number;
        purpose: {
          label: string;
          value: PurposeCode;
        };
      };
      const accessToken = (ctx.session as any).auth.access_token;

      // Make the transfer using the TransferService
      await this.transferService.emailTransfer(accessToken, {
        amount: BigInt(Math.round(amount * 10 ** 8)).toString(),
        payeeId: payee.id,
        email: payee.email,
        purposeCode: purpose.value,
        currency: 'USDC',
      });

      // Notify the user
      await ctx.replyWithMarkdownV2(
        `✅ Transfer successful\\!\n\n` +
          `👤 *Payee:* ${payee.nickName || payee.displayName}\n` +
          `💸 *Amount:* ${amount.toString()} USD\n` +
          `📝 *Purpose:* ${purpose.value}`,
      );

      // Exit the scene
      ctx.scene.leave();
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage: 'Failed to process your transfer',
        buttons: [
          { text: '🔃 Retry', action: EmailTransferActions.CONFIRM_TRANSFER },
        ],
      });
    }
  }

  @Action(EmailTransferActions.ADD_PAYEE)
  async addPayee(@Ctx() ctx: WizardContext) {
    ctx.answerCbQuery();
    ctx.scene.leave();
    ctx.scene.enter(ADD_PAYEE_SCENE_ID);
  }

  @Action(EmailTransferActions.BACK)
  async navigateBack(ctx: WizardContext) {
    ctx.answerCbQuery();
    ctx.wizard.back();
  }

  @Action(EmailTransferActions.CANCEL)
  async navigateCancel(ctx: WizardContext) {
    await ctx.answerCbQuery('🚫 Cancelling Transfer...');
    await ctx.scene.leave();
    await ctx.replyWithMarkdownV2('Transfer cancelled\\.', {
      reply_markup: this.keyboard.getMainKeyboard().reply_markup,
    });
  }

  @Action(EmailTransferActions.CLOSE)
  async close(ctx: WizardContext) {
    await ctx.deleteMessage();
  }

  @Command(Commands.Cancel)
  async cancel(@Ctx() ctx: WizardContext) {
    await ctx.scene.leave();
  }
}
