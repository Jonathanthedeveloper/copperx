import { Action, Ctx, Update } from 'nestjs-telegraf';
import { ReferralService } from './referral.service';
import { Actions } from 'src/enums/actions.enums';
import { Context, Markup } from 'telegraf';
import { escapeMarkdownV2 } from 'src/utils';
import { RequireAuth } from '../auth/auth.decorator';

@Update()
export class ReferralUpdate {
  constructor(private readonly referralService: ReferralService) {}

  @Action(Actions.REFERRALS)
  @RequireAuth()
  async referrals(@Ctx() ctx: Context) {
    ctx.answerCbQuery('🔃 Fetching Invite Codes...');
    const accessToken = ctx.session.auth?.access_token ?? '';

    try {
      // Fetch referral codes
      const referralCodesResponse =
        await this.referralService.listInviteCodes(accessToken);
      const referralCodes = referralCodesResponse.data;

      if (referralCodes.length === 0) {
        await ctx.replyWithMarkdownV2(
          '📢 *Invite Codes*\n\n❌ No invite codes found\\.',
          {
            reply_markup: Markup.inlineKeyboard([
              [Markup.button.callback('🔃 Refresh', Actions.REFERRALS)],
              [Markup.button.callback('❌ Close', Actions.CLOSE)],
            ]).reply_markup,
          },
        );
        return;
      }

      // Format the referral codes into a message
      let message = `*🎫 Your Invite Codes:* \n\n`;
      referralCodes.forEach((code, index) => {
        message += `  *${index + 1}.* Code: \`${escapeMarkdownV2(code.code)}\` \n`;
        message += `     Type: \`${escapeMarkdownV2(code.type)}\` \n`;
        message += `     Status: \`${escapeMarkdownV2(code.status)}\` \n`;
        message += `     Expiration: \`${escapeMarkdownV2(code.expirationDate)}\` \n\n`;
      });

      // Add a button to validate a referral code
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            '✅ Apply Invite Code',
            Actions.VALIDATE_REFERRAL,
          ),
        ],
        [Markup.button.callback('🔃 Refresh', Actions.REFERRALS)],
        [Markup.button.callback('❌ Close', Actions.CLOSE)],
      ]);

      // Send the formatted message
      await ctx.replyWithMarkdownV2(message, {
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      console.error('Error fetching referral codes:', error);
      await ctx.replyWithMarkdownV2(
        '❌ An error occurred while fetching referral codes\\. Please try again later\\.',
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🔃 Retry', Actions.REFERRALS)],
            [Markup.button.callback('❌ Close', Actions.CLOSE)],
          ]).reply_markup,
        },
      );
    }
  }

  @Action(Actions.VALIDATE_REFERRAL)
  async validateReferral(@Ctx() ctx: Context) {
    ctx.answerCbQuery('Method not implemented');
  }
}
