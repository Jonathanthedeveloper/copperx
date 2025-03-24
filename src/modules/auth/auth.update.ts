import { Action, Command, Ctx, InjectBot, Update } from 'nestjs-telegraf';
import { Actions } from 'src/enums/actions.enums';
import { Context, Markup, Telegraf } from 'telegraf';
import { AuthService } from './auth.service';
import { KeyboardsService } from '../shared/keyboard.service';
import { RequireAuth } from './auth.decorator';
import { SceneContext } from 'telegraf/typings/scenes';
import { AUTH_SCENE_ID } from './auth.scene';
import { handleErrorResponses } from 'src/utils';
import { CommandContextExtn } from 'telegraf/typings/telegram-types';
import { Commands } from 'src/enums/commands.enum';

@Update()
export class AuthUpdate {
  constructor(
    @InjectBot() bot: Telegraf<Context>,
    private readonly authService: AuthService,
    private readonly keyboard: KeyboardsService,
  ) {}

  @Action(Actions.LOGIN)
  async onLogin(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(AUTH_SCENE_ID);
  }

  @RequireAuth()
  @Action(Actions.PROFILE)
  async profile(@Ctx() ctx: Context) {
    ctx.answerCbQuery('🔃 Fetching your profile...');
    await this.handleProfile(ctx);
  }

  private async handleProfile(ctx: Context) {
    try {
      const user = await this.authService.getUserProfile(
        ctx.session.auth?.access_token ?? '',
      );
      // Store user data in session
      ctx.session.user = user;

      if (!user) {
        await handleErrorResponses({
          error: new Error('Failed to fetch user profile'),
          defaultMessage: 'Failed to fetch your profile',
          ctx,
          buttons: [{ text: '🔁 Retry', action: Actions.PROFILE }],
          prefix: '🛑',
        });
        return;
      }

      // Create a formatted message using MarkdownV2
      const profileMessage = [
        `*👤 User Profile*`,
        ``,
        `*Email:* ${user.email}`,
        `*Status:* ${user.status === 'active' ? '✅ Active' : '❌ Inactive'}`,
        `*Role:* ${user.role || 'User'}`,
        ``,
        `*💳 Wallet Information*`,
        `*Address:* \`${user.walletAddress}\``,
        `*Type:* ${user.walletAccountType || 'Standard'}`,
        ``,
        `*ℹ️ Additional Info*`,
        `*ID:* \`${user.id.substring(0, 8)}...\``,
        `*Organization ID:* \`${user.organizationId.substring(0, 8)}...\``,
      ].join('\n');

      // Create inline keyboard with actions
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Refresh', Actions.PROFILE)],
        [Markup.button.callback('🚪 Logout', Actions.LOGOUT)],
        [Markup.button.callback('❌ Close', Actions.CLOSE)],
      ]);

      // Escape special characters for MarkdownV2
      const escapedMessage = profileMessage
        .replace(/\./g, '\\.')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/-/g, '\\-')
        .replace(/!/g, '\\!');

      await ctx.replyWithMarkdownV2(escapedMessage, {
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      await handleErrorResponses({
        error,
        defaultMessage: 'Failed to display profile information',
        ctx,
        buttons: [{ text: '🔁 Retry', action: Actions.PROFILE }],
        prefix: '🛑',
      });
    }
  }

  private async handleLogout(ctx) {
    try {
      // Logout user
      await this.authService.logout(ctx.session.auth?.access_token || '');

      // Clear session data
      ctx.session.user = undefined;
      ctx.session.auth = undefined;

      await ctx.replyWithMarkdownV2(
        '*🚪 Successfully Logged Out\\!*\n\n' +
          '👋 Thank you for using CopperX\\. You can log back in anytime\\.',
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🔐 Log in Again', Actions.LOGIN)],
            [Markup.button.callback('❌ Close', Actions.CLOSE)],
          ]).reply_markup,
        },
      );
    } catch (error) {
      await handleErrorResponses({
        error,
        defaultMessage: 'Failed to logout',
        ctx,
        buttons: [{ text: '🔁 Retry', action: Actions.LOGOUT }],
        prefix: '🛑',
      });
    }
  }

  @RequireAuth()
  @Action(Actions.LOGOUT)
  async logout(@Ctx() ctx: Context) {
    await ctx.answerCbQuery('🚪 Logging you out...');
    await this.handleLogout(ctx);
  }

  @Command(Commands.Login)
  async loginCommand(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter(AUTH_SCENE_ID);
  }

  @RequireAuth()
  @Command(Commands.Logout)
  async logoutCommand(@Ctx() ctx: Context) {
    await this.handleLogout(ctx);
  }

  @Command(Commands.Profile)
  async profileCommand(@Ctx() ctx: Context) {
    await this.handleProfile(ctx);
  }
}
