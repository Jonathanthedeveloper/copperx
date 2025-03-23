import { Action, Ctx, Help, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf, Markup } from 'telegraf';
import { KeyboardsService } from './modules/shared/keyboard.service';
import { Actions } from './enums/actions.enums';
import { AuthService } from './modules/auth/auth.service';

@Update()
export class AppUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly keyboard: KeyboardsService,
    private readonly authService: AuthService,
  ) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    // check if the user is already logged in

    try {
      if (ctx.session.auth?.access_token) {
        await this.authService.getUserProfile(ctx.session.auth.access_token);
      } else {
        throw new Error('No access token');
      }
    } catch {
      const keyboard = this.keyboard.getUnauthenticatedKeyboard();
      await ctx.replyWithMarkdownV2(
        '*Welcome to CopperX\\!*\n\n_The Future of payments_',
        {
          reply_markup: keyboard.reply_markup,
        },
      );
      return;
    }
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('Commands List', 'COMMANDS')],
      [Markup.button.callback('Authentication Help', 'AUTH')],
      [Markup.button.callback('Wallet Management Help', 'WALLET')],
      [Markup.button.callback('Fund Transfer Help', 'TRANSFER')],
      [Markup.button.callback('Back to Main Menu', 'START')],
    ]);
    await ctx.reply('Help', {
      reply_markup: keyboard.reply_markup,
    });
  }

  @Action(Actions.CLOSE)
  async onClose(@Ctx() ctx: Context) {
    await ctx.deleteMessage();
  }
}
