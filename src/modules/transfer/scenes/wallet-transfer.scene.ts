import { Action, Ctx, SceneEnter, Wizard, WizardStep } from 'nestjs-telegraf';
import { TransferService } from '../transfer.service';
import { WizardContext } from 'telegraf/typings/scenes';
import { KeyboardsService } from 'src/modules/shared/keyboard.service';
import { Markup } from 'telegraf';
import { RequireAuth } from 'src/modules/auth/auth.decorator';
import { handleErrorResponses } from 'src/utils';

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

  @SceneEnter()
  async askWalletAddress(@Ctx() ctx: WizardContext) {
    // Send the wallet address prompt only once
    await ctx.replyWithMarkdownV2(
      "📤 *Transfer to Wallet Address*\n\nPlease enter the recipient's wallet address:",
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🚫 Cancel', WalletTransferActions.CANCEL)],
        ]).reply_markup,
      },
    );
  }

  @WizardStep(1)
  async handleWalletAddress(@Ctx() ctx: WizardContext) {
    const walletAddress = (ctx.message as any)?.text;

    // Validate wallet address
    if (
      !walletAddress ||
      !walletAddress.startsWith('0x') ||
      walletAddress.length !== 42
    ) {
      await ctx.replyWithMarkdownV2(
        '❌ Invalid wallet address\\. Please enter a valid wallet address\\.',
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🚫 Cancel', WalletTransferActions.CANCEL)],
          ]).reply_markup,
        },
      );
      return; // Stay in the same step
    }

    // Store wallet address in wizard state
    // @ts-expect-error
    ctx.wizard.state.walletAddress = walletAddress;

    // Ask for the amount to transfer
    await ctx.replyWithMarkdownV2(
      '💰 *Amount*\n\nPlease enter the amount \\(USDC\\) to transfer:',
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🚫 Cancel', WalletTransferActions.CANCEL)],
        ]).reply_markup,
      },
    );

    ctx.wizard.next();
  }

  @WizardStep(2)
  async handleAmount(@Ctx() ctx: WizardContext) {
    const amount = parseFloat((ctx.message as any)?.text);

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      await ctx.replyWithMarkdownV2(
        '❌ Invalid amount\\. Please enter a valid amount\\.',
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🚫 Cancel', WalletTransferActions.CANCEL)],
          ]).reply_markup,
        },
      );
      return; // Stay in the same step
    }

    // Store amount in wizard state
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
      Markup.button.callback('🚫 Cancel', WalletTransferActions.CANCEL),
    ]);

    await ctx.replyWithMarkdownV2(
      '📝 *Purpose*\n\nPlease select the purpose of this transfer:',
      {
        reply_markup: Markup.inlineKeyboard(buttonRows).reply_markup,
      },
    );

    ctx.wizard.next();
  }

  @Action(/^PURPOSE:(.+)$/)
  async handlePurposeSelection(@Ctx() ctx: WizardContext) {
    // Extract the purpose value from callback data
    const purposeValue =
      (ctx.callbackQuery as { data: string })?.data?.split(':')[1] || '';

    const purpose = this.transferService.purposeCodes.find(
      (p) => p.value === purposeValue,
    );

    if (!purpose) {
      await ctx.answerCbQuery('❌ Invalid selection');
      return;
    }

    // Store the purpose in wizard state
    // @ts-expect-error
    ctx.wizard.state.purpose = purpose;

    // Acknowledge the selection
    await ctx.answerCbQuery(`✅ Selected: ${purpose.label}`);

    // Confirm the transfer details
    await this.confirmTransfer(ctx);
  }

  async confirmTransfer(@Ctx() ctx: WizardContext) {
    // @ts-expect-error
    const { walletAddress, amount, purpose } = ctx.wizard.state;

    await ctx.replyWithMarkdownV2(
      `📝 *Transfer Details*\n\n` +
        `*Wallet Address:* ${walletAddress}\n` +
        `*Amount:* ${amount} USDC\n` +
        `*Purpose:* ${purpose.label}\n\n` +
        'Confirm the details above and proceed with the transfer?',
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('✅ Confirm', WalletTransferActions.CONFIRM)],
          [Markup.button.callback('🚫 Cancel', WalletTransferActions.CANCEL)],
        ]).reply_markup,
      },
    );
  }

  @Action(WalletTransferActions.CONFIRM)
  async confirm(@Ctx() ctx: WizardContext) {
    // @ts-expect-error
    const { walletAddress, amount, purpose } = ctx.wizard.state;

    await ctx.answerCbQuery('🔄 Processing Transfer...');

    try {
      await this.transferService.walletTransfer(
        // @ts-expect-error
        ctx.session.auth?.access_token ?? '',
        {
          walletAddress,
          amount: BigInt(Math.round(amount * 10 ** 8)).toString(),
          purposeCode: purpose.value,
          currency: 'USDC',
        },
      );

      await ctx.replyWithMarkdownV2(
        `💸 *Transfer Successful*\n\n` +
          `*Wallet Address:* ${walletAddress}\n` +
          `*Amount:* ${amount} USDC\n` +
          `*Purpose:* ${purpose.label}`,
        {
          reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        },
      );
    } catch (error) {
      console.log(error.response?.data?.message);
      await handleErrorResponses({
        ctx,
        error,
        buttons: [{ text: '🔁 Retry', action: WalletTransferActions.CONFIRM }],
        defaultMessage: 'Failed to process transfer',
        prefix: '❌ *Transfer Failed*\n\n',
      });
    }
  }

  @Action(WalletTransferActions.CANCEL)
  async cancel(@Ctx() ctx: WizardContext) {
    await ctx.answerCbQuery('🚫 Cancelling Transfer...');
    await ctx.replyWithMarkdownV2('❌ Transfer Cancelled', {
      reply_markup: this.keyboard.getMainKeyboard().reply_markup,
    });

    await ctx.scene.leave();
  }
}
