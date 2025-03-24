import {
  Action,
  Command,
  Ctx,
  Help,
  InjectBot,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Context, Telegraf, Markup } from 'telegraf';
import { KeyboardsService } from './modules/shared/keyboard.service';
import { Actions } from './enums/actions.enums';
import { AuthService } from './modules/auth/auth.service';
import { AppService } from './app.service';
import { Commands } from './enums/commands.enum';
import { RequireAuth } from './modules/auth/auth.decorator';
import { commandDescriptions } from './constants';
import { escapeMarkdownV2 } from './utils';

@Update()
export class AppUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly keyboard: KeyboardsService,
    private readonly authService: AuthService,
    private readonly appService: AppService,
  ) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    try {
      await this.handleAuthenticatedUser(ctx);
      ctx.replyWithMarkdownV2(
        `👋 *Welcome to CopperX\\!*\n\n🚀 _The Future of payments`,
        {
          reply_markup: this.keyboard.getMainKeyboard().reply_markup,
        },
      );
    } catch {
      await this.handleUnauthenticatedUser(ctx);
    }
  }

  private async handleAuthenticatedUser(ctx: Context) {
    if (!ctx.session.auth?.access_token) {
      throw new Error('No access token');
    }
    await this.authService.getUserProfile(ctx.session.auth.access_token);
  }

  private async handleUnauthenticatedUser(ctx: Context) {
    const keyboard = this.keyboard.getUnauthenticatedKeyboard();
    const message =
      '👋 *Welcome to CopperX\\!*\n\n🚀 _The Future of payments_\n\n🔐 Please authenticate to continue\\.';

    await ctx.replyWithMarkdownV2(message, {
      reply_markup: keyboard.reply_markup,
    });
  }

  @Help()
  @Action(Actions.HELP)
  async help(@Ctx() ctx: Context) {
    const helpMessage = Object.values(commandDescriptions).join('\n');

    await ctx.replyWithMarkdownV2(
      `*📃 Help*\n\n${escapeMarkdownV2(helpMessage)}`,
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback('❌ Close', Actions.CLOSE),
        ]).reply_markup,
      },
    );
  }

  @Action(Actions.CLOSE)
  async onClose(@Ctx() ctx: Context) {
    await ctx.deleteMessage();
  }

  @RequireAuth()
  @Command(Commands.MAIN_MENU)
  async handleMainMenu(@Ctx() ctx: Context) {
    await ctx.replyWithMarkdownV2(
      '👋 *Welcome to CopperX\\!*\n\n🚀 _The Future of payments_\n\nWhat will you be doing today\\?',
      {
        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
      },
    );
  }
  @Action(Actions.MAIN_MENU)
  async handleMainMenuAction(@Ctx() ctx: Context) {
    ctx.answerCbQuery();
    await ctx.replyWithMarkdownV2(
      '👋 *Welcome to CopperX\\!*\n\n🚀 _The Future of payments_\n\nWhat will you be doing today\\?',
      {
        reply_markup: this.keyboard.getMainKeyboard().reply_markup,
      },
    );
  }
}
