// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { WizardStep, Ctx, Wizard, Action } from 'nestjs-telegraf';
import { Context, Markup, Scenes } from 'telegraf';
import { AuthService } from './auth.service';
import { isEmail } from 'class-validator';
import { DepositService } from '../deposit/deposit.service';
import { KeyboardsService } from '../shared/keyboard.service';
import { User } from 'src/types';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import {
  WizardContext,
  WizardContextWizard,
  WizardSession,
  WizardSessionData,
} from 'telegraf/typings/scenes';
import { escapeMarkdownV2 } from 'src/utils';

interface AuthContext extends WizardContext {
  session: WizardSession;
  wizard: WizardContextWizard<WizardContext<WizardSessionData>>;
  state: {
    email?: string;
    sid?: string;
  };
}

// Define the scene ID
export const AUTH_SCENE_ID = 'AUTH_SCENE';

enum AuthActions {
  BACK = 'BACK',
  CANCEL = 'CANCEL',
  RESEND_OTP = 'RESEND_OTP',
  CLOSE = 'CLOSE',
}

@Wizard(AUTH_SCENE_ID)
export class AuthScene {
  constructor(
    private readonly authService: AuthService,
    private readonly depositService: DepositService,
    private readonly keyboard: KeyboardsService,
  ) {}

  private getNavigationKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('🔙 Back', AuthActions.BACK),
        Markup.button.callback('❌ Cancel', AuthActions.CANCEL),
      ],
      [Markup.button.callback('❌ Close', AuthActions.CLOSE)],
    ]);
  }

  private getOtpKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Resend OTP', AuthActions.RESEND_OTP)],
      [
        Markup.button.callback('🔙 Back', AuthActions.BACK),
        Markup.button.callback('❌ Cancel', AuthActions.CANCEL),
      ],
      [Markup.button.callback('❌ Close', AuthActions.CLOSE)],
    ]);
  }

  @WizardStep(1)
  async askEmail(@Ctx() ctx: AuthContext) {
    if ((ctx.message as { text: string })?.text) {
      // check if it's valid email
      if (!isEmail(ctx.message.text)) {
        await ctx.replyWithMarkdownV2(
          'Invalid email address\\. Please enter a valid email address',
          {
            reply_markup: this.getNavigationKeyboard().reply_markup,
            reply_parameters: {
              message_id: ctx.message.message_id,
              chat_id: ctx.chat?.id,
              allow_sending_without_reply: true,
            },
          },
        );
        return;
      }

      try {
        // Request OTP and store email and sid in session
        const { email, sid } = await this.authService.requestAuthOtp({
          email: (ctx.message as { text: string }).text,
        });

        ctx.wizard.state.email = email;
        ctx.wizard.state.sid = sid;

        await ctx.replyWithMarkdownV2(
          `Please Enter OTP sent to email \\(${escapeMarkdownV2(email)}\\)`,
          {
            reply_markup: this.getOtpKeyboard().reply_markup,
          },
        );

        ctx.wizard.next();
      } catch (error) {
        console.error(error);
        await ctx.replyWithMarkdownV2(
          "Couldn't send OTP\\. Please try again later",
          {
            reply_markup: this.getNavigationKeyboard().reply_markup,
          },
        );
      }
    } else {
      await ctx.replyWithMarkdownV2(
        '🔑 Please enter your email to receive a login OTP:',
        {
          reply_markup: this.getNavigationKeyboard().reply_markup,
        },
      );
    }
  }

  @WizardStep(2)
  async askOtp(@Ctx() ctx: WizardContext<WizardSessionData>) {
    if ((ctx.message as { text: string })?.text) {
      try {
        // Verify OTP and get access token
        const data = await this.authService.authenticate({
          email: ctx.wizard.state.email,
          sid: ctx.wizard.state.sid,
          otp: (ctx.message as { text: string })?.text,
        });

        // Store access token in session
        ctx.session.auth = { access_token: data.accessToken };
        ctx.session.user = data.user;

        const keyboard = this.keyboard.getMainKeyboard();

        await ctx.replyWithMarkdownV2('🔑 Successfully logged in', {
          reply_markup: keyboard.reply_markup,
        });
        await ctx.scene.leave();
      } catch (error) {
        console.error(error.response.message);
        await ctx.replyWithMarkdownV2('Invalid OTP\\. Please try again', {
          reply_markup: this.getOtpKeyboard().reply_markup,
        });
      }
    } else {
    }
  }

  // Action handlers
  @Action(AuthActions.BACK)
  async handleBack(@Ctx() ctx: AuthContext) {
    await ctx.answerCbQuery();
    ctx.wizard.selectStep(0);
    await ctx.replyWithMarkdownV2(
      '🔑 Please enter your email to receive a login OTP:',
      {
        reply_markup: this.getNavigationKeyboard().reply_markup,
      },
    );
  }

  @Action(AuthActions.CANCEL)
  async handleCancel(@Ctx() ctx: AuthContext) {
    await ctx.answerCbQuery();
    const mainKeyboard = this.keyboard.getUnauthenticatedKeyboard();
    await ctx.replyWithMarkdownV2(
      'Operation cancelled\\. Returning to main menu\\.',
      {
        reply_markup: mainKeyboard.reply_markup,
      },
    );
    await ctx.scene.leave();
  }

  @Action(AuthActions.RESEND_OTP)
  async handleResendOtp(@Ctx() ctx: AuthContext) {
    await ctx.answerCbQuery();
    try {
      const { email, sid } = await this.authService.requestAuthOtp({
        email: ctx.wizard.state.email,
      });

      ctx.wizard.state.sid = sid;
      await ctx.replyWithMarkdownV2(
        `New OTP sent to ${escapeMarkdownV2(email)}\\. Please enter the code:`,
        this.getOtpKeyboard(),
      );
    } catch (error) {
      console.error(error);
      await ctx.replyWithMarkdownV2(
        "Couldn't send OTP\\. Please try again later\\.",
        this.getOtpKeyboard(),
      );
    }
  }

  @Action(AuthActions.CLOSE)
  async handleClose(@Ctx() ctx: AuthContext) {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.leave();
  }
}
