import { Action, Ctx, InjectBot, On, Update } from 'nestjs-telegraf';
import { Actions } from 'src/enums/actions.enums';
import { Context, Markup, Telegraf } from 'telegraf';
import { AuthService } from './auth.service';
import { isEmail } from 'class-validator';
import { Update as UpdateType } from 'telegraf/typings/core/types/typegram';
import { KeyboardsService } from '../shared/keyboard.service';

@Update()
export class AuthUpdate {
  constructor(
    @InjectBot() bot: Telegraf<Context>,
    private readonly authService: AuthService,
    private readonly keyboard: KeyboardsService,
  ) {}

  @Action(Actions.LOGIN)
  async onLogin(@Ctx() ctx: Context) {
    ctx.session.step = 'AWAITING_EMAIL';

    const keyboard = Markup.inlineKeyboard([
      Markup.button.callback('Back to Main Menu', 'start'),
    ]);

    await ctx.editMessageText(
      '🔑 Please enter your email to receive a login OTP:',
      {
        reply_markup: keyboard.reply_markup,
      },
    );
  }

  @Action(Actions.PROFILE)
  async profile(@Ctx() ctx: Context) {
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

  @On('text')
  async onEmail(@Ctx() ctx: Context<UpdateType.MessageUpdate>) {
    if (ctx.session.step === 'AWAITING_EMAIL') {
      if (!isEmail((ctx.message as { text: string }).text))
        return await ctx.replyWithMarkdownV2(
          'Invalid email address\\. Please enter a valid email address',
        );

      try {
        // Request OTP and store email and sid in session
        const { email, sid } = await this.authService.requestAuthOtp({
          email: (ctx.message as { text: string }).text,
        });

        ctx.session.step = 'AWAITING_OTP';
        ctx.session.auth = { email, sid };

        await ctx.reply('Please Enter OTP sent to email');
      } catch (error) {
        console.error(error);
        await ctx.reply("Couldn't send OTP\\. Please try again later");
      }

      return;
    } else if (ctx.session.step === 'AWAITING_OTP') {
      console.log(ctx.message);
      const authData = ctx.session.auth;
      const otp = (ctx.message as { text: string }).text;

      if (!authData) {
        await ctx.reply('Authentication data is missing. Please try again\\.');
        return;
      }

      try {
        const data = await this.authService.authenticate({
          email: authData.email!,
          otp,
          sid: authData.sid!,
        });

        ctx.session.user = data.user;
        ctx.session.auth = {
          access_token: data.accessToken,
        };
        ctx.session.step = undefined;

        const keyboard = this.keyboard.getMainKeyboard();

        await ctx.replyWithMarkdownV2('Login Success', {
          reply_markup: keyboard.reply_markup,
        });
      } catch (error) {
        console.error(error);
        await ctx.reply('Invalid OTP\\. Please try again\\.');
        return;
      }
    }
    // console.log(ctx);
  }
}
