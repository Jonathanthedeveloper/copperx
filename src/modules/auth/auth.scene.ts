// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { WizardStep, Ctx, Wizard, Action, Command } from 'nestjs-telegraf';
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
import { escapeMarkdownV2, handleErrorResponses } from 'src/utils';
import { Commands } from 'src/enums/commands.enum';

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
        Markup.button.callback('🚫 Cancel', AuthActions.CANCEL),
      ],
      [Markup.button.callback('❌ Close', AuthActions.CLOSE)],
    ]);
  }

  private getOtpKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Resend OTP', AuthActions.RESEND_OTP)],
      [
        Markup.button.callback('🔙 Back', AuthActions.BACK),
        Markup.button.callback('🚫 Cancel', AuthActions.CANCEL),
      ],
      [Markup.button.callback('❌ Close', AuthActions.CLOSE)],
    ]);
  }

  @WizardStep(1)
  async askEmail(@Ctx() ctx: AuthContext) {
    // Immediately prompt the user for their email
    await ctx.replyWithMarkdownV2(
      '🔑 Please enter your email to receive a login OTP:',
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🚫 Cancel', AuthActions.CANCEL)],
        ]).reply_markup,
      },
    );

    // Move to the next step to handle the email input
    ctx.wizard.next();
  }

  @WizardStep(2)
  async handleEmailInput(@Ctx() ctx: AuthContext) {
    const messageText = (ctx.message as { text: string })?.text;

    // Validate the email
    if (!isEmail(messageText)) {
      await ctx.replyWithMarkdownV2(
        '❌ Invalid email address\\. Please enter a valid email address:',
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🚫 Cancel', AuthActions.CANCEL)],
          ]).reply_markup,
        },
      );
      return;
    }

    try {
      // Request OTP and store email and sid in session
      const { email, sid } = await this.authService.requestAuthOtp({
        email: messageText,
      });

      ctx.wizard.state.email = email;
      ctx.wizard.state.sid = sid;

      await ctx.replyWithMarkdownV2(
        `📧 Please enter the OTP sent to ${escapeMarkdownV2(email)}:`,
        {
          reply_markup: this.getOtpKeyboard().reply_markup,
        },
      );

      ctx.wizard.next();
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        buttons: [{ text: '🔁 Retry', action: AuthActions.RESEND_OTP }],
        defaultMessage: 'Failed to send OTP',
        prefix: '❌ *Failed to send OTP*\n\n',
      });
    }
  }

  @WizardStep(3)
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

        await this.depositService.subscribeToDepositEvents({
          accessToken: data.accessToken,
          userId: data.user.id,
          chatId: ctx.chat?.id,
          organizationId: data.user.organizationId,
        });
        await ctx.scene.leave();
      } catch (error) {
        await handleErrorResponses({
          ctx,
          error,
          buttons: [{ text: '🔁 Retry', action: AuthActions.RESEND_OTP }],
          defaultMessage: 'Failed to authenticate',
          prefix: '❌ *Authentication Failed*\n\n',
        });
      }
    }
  }

  // Action handlers
  @Action(AuthActions.BACK)
  async handleBack(@Ctx() ctx: AuthContext) {
    await ctx.answerCbQuery();
    ctx.wizard.selectStep(1);
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
      '❌ Operation cancelled\\. Returning to main menu\\.',
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
        `📧 New OTP sent to ${escapeMarkdownV2(email)}\\. Please enter the code:`,
        this.getOtpKeyboard(),
      );
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        buttons: [{ text: '🔁 Retry', action: AuthActions.RESEND_OTP }],
        defaultMessage: 'Failed to send OTP',
        prefix: '❌ *Failed to send OTP*\n\n',
      });
    }
  }

  @Action(AuthActions.CLOSE)
  async handleClose(@Ctx() ctx: AuthContext) {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.leave();
  }

  @Command(Commands.Cancel)
  async handleCancelCommand(@Ctx() ctx: AuthContext) {
    await ctx.scene.leave();
  }
}
