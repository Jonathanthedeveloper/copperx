import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { TransferService } from '../transfer.service';
import { WizardContext } from 'telegraf/typings/scenes';
import { KeyboardsService } from 'src/modules/shared/keyboard.service';
import { Markup } from 'telegraf';
import { RequireAuth } from 'src/modules/auth/auth.decorator';

export const WALLET_TRANSFER_SCENE = 'WALLET_TRANSFER_SCENE';

enum WalletTransferActions {
  CANCEL = 'CANCEL',
  CONFIRM = 'CONFIRM',
}

@Wizard(WALLET_TRANSFER_SCENE)
@RequireAuth()
export class WalletTransferScene {
  constructor(
    private readonly transferService: TransferService,
    private readonly keyboard: KeyboardsService,
  ) {}

  @WizardStep(1)
  async askWalletAddress(@Ctx() ctx: WizardContext) {
    // @ts-expect-error
    if (!ctx.message?.text) {
      await ctx.replyWithMarkdownV2(
        '📤 *Transfer to Wallet Address*\n\nPlease Enter recipient wallet address',
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('❌ Cancel', WalletTransferActions.CANCEL)],
          ]).reply_markup,
        },
      );
      return;
    }

    // Validate wallet address
    // @ts-expect-error
    const walletAddress = ctx.message.text;
    if (!walletAddress.startsWith('0x')) {
      await ctx.replyWithMarkdownV2(
        'Invalid wallet address\\. Please enter a valid wallet address',
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('❌ Cancel', WalletTransferActions.CANCEL)],
          ]).reply_markup,
        },
      );
      return;
    }

    // @ts-expect-error
    ctx.wizard.state.walletAddress = walletAddress;
    // ctx.replyWithMarkdownV2(
    //   '💰 *Amount*\n\nPlease Enter the amount\\(USDT\\) to transfer',
    //   {
    //     reply_markup: Markup.inlineKeyboard([
    //       [Markup.button.callback('❌ Cancel', WalletTransferActions.CANCEL)],
    //     ]).reply_markup,
    //   },
    // );
    ctx.wizard.next();
  }
  @WizardStep(2)
  async askAmount(@Ctx() ctx: WizardContext) {
    // @ts-expect-error
    if (!ctx.message?.text) {
      ctx.replyWithMarkdownV2(
        '💰 *Amount*\n\nPlease Enter the amount\\(USDT\\) to transfer',
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('❌ Cancel', WalletTransferActions.CANCEL)],
          ]).reply_markup,
        },
      );
      return;
    }

    // Validate amount
    // @ts-expect-error
    const amount = parseFloat(ctx.message.text);
    if (isNaN(amount)) {
      ctx.replyWithMarkdownV2('Invalid amount\\. Please enter a valid amount', {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', WalletTransferActions.CANCEL)],
        ]).reply_markup,
      });
      return;
    }

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
      Markup.button.callback('❌ Cancel', WalletTransferActions.CANCEL),
    ]);

    ctx.replyWithMarkdownV2(
      '📝 *Purpose*\n\nPlease Enter the purpose of this transfer',
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
    // @ts-expect-error
    const { walletAddress, amount, purpose } = ctx.wizard.state;
    await ctx.replyWithMarkdownV2(
      `📝 *Transfer Details*\n\n` +
        `*Wallet Address:* ${walletAddress}\n` +
        `*Amount:* ${amount} USDT\n` +
        `*Purpose:* ${purpose.label}\n\n` +
        'Confirm the details above and proceed with the transfer?',
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('✅ Confirm', WalletTransferActions.CONFIRM)],
          [Markup.button.callback('❌ Cancel', WalletTransferActions.CANCEL)],
        ]).reply_markup,
      },
    );
  }

  @Action(WalletTransferActions.CONFIRM)
  async confirm(@Ctx() ctx: WizardContext) {
    // @ts-expect-error
    const { walletAddress, amount, purpose } = ctx.wizard.state;
    ctx.answerCbQuery('🔄 Processing Transfer...');

    try {
      // @ts-expect-error
      await this.transferService.walletTransfer(ctx.session.accessToken, {
        walletAddress,
        amount: (amount * 10_000_000).toString(),
        purposeCode: purpose.value,
        currency: 'USDT',
      });

      await ctx.replyWithMarkdownV2(
        `💸 *Transfer Successful*\n\n` +
          `*Wallet Address:* ${walletAddress}\n` +
          `*Amount:* ${amount} USDT\n` +
          `*Purpose:* ${purpose.label}`,
        {
          reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        },
      );
      ctx.scene.leave();
    } catch (error) {
      console.error(error);
      await ctx.replyWithMarkdownV2(
        `💸 *Transfer Failed*\n\n*Reason:* ${error.response?.data?.message || 'Something Went wrong'}\n\n` +
          `*Wallet Address:* ${walletAddress}\n` +
          `*Amount:* ${amount} USDT\n` +
          `*Purpose:* ${purpose.label}`,
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🔁 Retry', WalletTransferActions.CONFIRM)],
            [Markup.button.callback('❌ Cancel', WalletTransferActions.CANCEL)],
          ]).reply_markup,
        },
      );
    }
  }

  @Action(WalletTransferActions.CANCEL)
  async cancel(@Ctx() ctx: WizardContext) {
    ctx.answerCbQuery('🔃 Cancelling Transfer...');
    await ctx.replyWithMarkdownV2(`Transfer Cancelled`, {
      reply_markup: this.keyboard.getMainKeyboard().reply_markup,
    });

    ctx.scene.leave();
  }
}
