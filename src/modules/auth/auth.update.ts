import { Action, Ctx, InjectBot, Update } from 'nestjs-telegraf';
import { Actions } from 'src/enums/actions.enums';
import { Context, Telegraf } from 'telegraf';
import { AuthService } from './auth.service';
import { KeyboardsService } from '../shared/keyboard.service';
import { RequireAuth } from './auth.decorator';
import { SceneContext } from 'telegraf/typings/scenes';
import { AUTH_SCENE_ID } from './auth.scene';
import { escapeMarkdownV2 } from 'src/utils';

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
    await ctx.answerCbQuery();
    try {
      // Check if user is logged in
      if (!ctx.session.auth?.access_token) {
        const keyboard = this.keyboard.getUnauthenticatedKeyboard();
        await ctx.replyWithMarkdownV2(
          'You are not logged in\\. Please login first\\.',
          {
            reply_markup: keyboard.reply_markup,
          },
        );
        return;
      }

      const user = await this.authService.getUserProfile(
        ctx.session.auth.access_token,
      );
      // Store user data in session
      ctx.session.user = user;

      if (!user) {
        await ctx.reply("You're not logged in\\. Please login first\\.");
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
      const keyboard = this.keyboard.getProfileKeyboard();

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
      console.error('Error displaying profile:', error);
      await ctx.reply(
        'Failed to display profile information. Please try again.',
      );
    }
  }

  @Action(Actions.LOGOUT)
  async logout(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    try {
      // Check if user is logged in
      if (!ctx.session.auth?.access_token) {
        const keyboard = this.keyboard.getUnauthenticatedKeyboard();
        await ctx.replyWithMarkdownV2(
          'You are not logged in\\. Please login first\\.',
          {
            reply_markup: keyboard.reply_markup,
          },
        );
        return;
      }

      // Logout user
      await this.authService.logout(ctx.session.auth.access_token);

      // Clear session data

      ctx.session.user = undefined;
      ctx.session.auth = undefined;

      // Create a new keyboard with login option

      const keyboard = this.keyboard.getUnauthenticatedKeyboard();

      await ctx.replyWithMarkdownV2('You have been logged out\\.', {
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      console.error('Error logging out:', error);
      await ctx.reply('Failed to logout\\. Please try again\\.');
    }
  }
}
