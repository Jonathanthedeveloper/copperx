import { Action, Command, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext, WizardScene } from 'telegraf/typings/scenes';
import { WalletService } from '../wallet/wallet.service';
import { Markup } from 'telegraf';
import { KeyboardsService } from '../shared/keyboard.service';
import qrcode from 'qrcode';
import { RequireAuth } from '../auth/auth.decorator';
import { escapeMarkdownV2, handleErrorResponses } from 'src/utils';
import { Commands } from 'src/enums/commands.enum';

export const DEPOSIT_SCENE_ID = 'DEPOSIT_SCENE';

enum DepositSceneActions {
  CANCEL = 'CANCEL',
  BACK = 'BACK',
  CLOSE = 'CLOSE',
}

@RequireAuth()
@Wizard(DEPOSIT_SCENE_ID)
export class DepositScene {
  constructor(
    private readonly walletService: WalletService,
    private readonly keyboard: KeyboardsService,
  ) {}

  @WizardStep(1)
  async showAvailableNetworks(@Ctx() ctx: WizardContext) {
    const keyboard = Markup.inlineKeyboard([
      ...Object.entries(this.walletService.networks).map(([id, name]) => [
        Markup.button.callback(name, `NETWORK:${id}`),
      ]),
      [Markup.button.callback('🚫 Cancel', DepositSceneActions.CANCEL)],
    ]);

    await ctx.replyWithMarkdownV2(
      "Please choose the network you'd like to deposit to:",
      {
        reply_markup: keyboard.reply_markup,
      },
    );

    ctx.wizard.next();
  }

  @Action(/^NETWORK:(.+)$/)
  async handleNetworkSelection(@Ctx() ctx: WizardContext) {
    const callbackData = (ctx.callbackQuery as { data: string })?.data;
    const match = callbackData.match(/^NETWORK:(.+)$/);

    const networkId = match ? match[1] : null;
    if (!networkId) {
      ctx.reply('Invalid network selected.');
      return ctx.scene.leave();
    }

    try {
      const wallets = await this.walletService.getWallets(
        // @ts-expect-error
        ctx.session.auth?.access_token ?? '',
      );

      ctx.answerCbQuery('🔃 Fetching Wallets');

      const wallet = wallets.find((w) => w.network === networkId);

      if (!wallet) {
        ctx.reply('No wallets found for the selected network.');
        return ctx.scene.leave();
      }

      const message = `
        💎 *Deposit Instructions*
  
  To deposit funds to your wallet:
  
  1\\. Send your funds to this address: \`${escapeMarkdownV2(wallet.walletAddress)}\`
  
  2\\. Make sure to select the correct network: *${escapeMarkdownV2(this.walletService.networks[wallet.network])}*
  
  ⚠️ *Important:*
  • Only send supported tokens
  • Double\\-check the network before sending
  • Minimum deposit amount may apply
        `;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            '🔍 View QR Code',
            `QR:${wallet.walletAddress}`,
          ),
        ],
        [Markup.button.callback('🚫 Cancel', DepositSceneActions.CANCEL)],
        [Markup.button.callback('❌ Close', DepositSceneActions.CLOSE)],
      ]);

      await ctx.replyWithMarkdownV2(message, {
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage: 'Failed to load wallets',
        header: '🚫 *Error*',
      });
    }
  }

  @Action(/^QR:(.+)$/)
  async showQRCode(@Ctx() ctx: WizardContext) {
    ctx.answerCbQuery('🔍 Generating QR Code...');
    // @ts-expect-error
    const walletAddress = ctx.callbackQuery?.data?.split(':')[1];
    if (!walletAddress) {
      await ctx.replyWithMarkdownV2(
        '⚠️ Invalid wallet address\\. Please try again\\.',
        {
          reply_markup: Markup.inlineKeyboard([
            Markup.button.callback('🚫 Cancel', DepositSceneActions.CANCEL),
          ]).reply_markup,
        },
      );
      ctx.scene.leave();
      return;
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🚫 Cancel', DepositSceneActions.CANCEL)],
      [Markup.button.callback('❌ Close', DepositSceneActions.CLOSE)],
    ]);

    const url = await qrcode.toDataURL(walletAddress, {
      width: 300,
    });
    await ctx.replyWithPhoto(
      { source: Buffer.from(url.split('base64,')[1], 'base64') },
      {
        caption:
          '📱 Scan this QR code to deposit funds to: `' + walletAddress + '`',
        reply_markup: keyboard.reply_markup,
        parse_mode: 'MarkdownV2',
      },
    );
  }

  @Action(DepositSceneActions.CANCEL)
  async cancelDeposit(@Ctx() ctx: WizardContext) {
    ctx.answerCbQuery('🚫 Cancelling Deposit...');
    await ctx.replyWithMarkdownV2('Deposit cancelled', {
      reply_markup: this.keyboard.getMainKeyboard().reply_markup,
    });
    await ctx.scene.leave();
  }

  @Action(DepositSceneActions.BACK)
  async back(@Ctx() ctx: WizardContext) {
    ctx.answerCbQuery();
    ctx.wizard.back();
  }

  @Action(DepositSceneActions.CLOSE)
  async close(@Ctx() ctx: WizardContext) {
    ctx.answerCbQuery();
    await ctx.deleteMessage();
  }

  @Command(Commands.Cancel)
  async cancel(@Ctx() ctx: WizardContext) {
    await ctx.scene.leave();
  }
}
