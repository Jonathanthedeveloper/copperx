import { Ctx, Help, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf, Markup } from 'telegraf';
import { KeyboardsService } from './modules/shared/keyboard.service';

@Update()
export class AppUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly keyboard: KeyboardsService,
  ) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    // check if the user is already logged in

    if (ctx.session?.user) {
      const keyboard = this.keyboard.getMainKeyboard();

      await ctx.replyWithMarkdownV2('Welcome back\\!', {
        reply_markup: keyboard.reply_markup,
      });
      return;
    }

    const keyboard = this.keyboard.getUnauthenticatedKeyboard();

    await ctx.replyWithMarkdownV2(
      '*Welcome to CopperX\\!*\n\n_The Future of payments_',
      {
        reply_markup: keyboard.reply_markup,
      },
    );
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
}
