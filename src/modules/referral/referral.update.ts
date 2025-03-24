import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { ReferralService } from './referral.service';
import { Actions } from 'src/enums/actions.enums';
import { Context, Markup } from 'telegraf';
import { escapeMarkdownV2, handleErrorResponses } from 'src/utils';
import { RequireAuth } from '../auth/auth.decorator';
import { Commands } from 'src/enums/commands.enum';

@Update()
@RequireAuth()
export class ReferralUpdate {
  constructor(private readonly referralService: ReferralService) {}

  @Action(Actions.REFERRALS)
  async handleReferralAction(@Ctx() ctx: Context) {
    ctx.answerCbQuery('🔃 Fetching Invite Codes...');
    await this.referrals(ctx);
  }

  @Command(Commands.REFERRALS)
  async handleReferralCommand(@Ctx() ctx: Context) {
    const [message] = await Promise.allSettled([
      ctx.replyWithMarkdownV2('🔃 Fetching Invite Codes...'),
      this.referrals(ctx),
    ]);

    if (message.status === 'fulfilled') {
      await ctx.deleteMessage(message.value.message_id);
    }
  }

  async referrals(ctx) {
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
      await handleErrorResponses({
        error,
        ctx,
        defaultMessage: 'Error fetching referral codes',
        buttons: [{ text: '🔃 Retry', action: Actions.REFERRALS }],
        prefix: '📢 *Invite Codes*\n\n',
      });
    }
  }

  @Action(Actions.VALIDATE_REFERRAL)
  async validateReferral(@Ctx() ctx: Context) {
    ctx.answerCbQuery('Method not implemented');
  }
}
