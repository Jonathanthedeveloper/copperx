import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Actions } from 'src/enums/actions.enums';
import { KycService } from './kyc.service';
import { Context, Markup } from 'telegraf';
import { escapeMarkdownV2 } from 'src/utils';
import { RequireAuth } from '../auth/auth.decorator';

@Update()
@RequireAuth()
export class KycUpdate {
  constructor(private readonly kycService: KycService) {}

  private statusMessages = {
    pending:
      '⏳ Your KYC application is pending. Please complete the required steps to proceed.',
    initiated:
      '🚀 Your KYC application has been initiated. Please complete the process to proceed.',
    inprogress:
      '🔄 Your KYC application is in progress. We are currently reviewing your submission.',
    review_pending:
      '📝 Your KYC application is pending review. We will notify you once the review is complete.',
    review:
      '🔍 Your KYC application is under review. Please wait for the results.',
    provider_manual_review:
      '👨‍💻 Your KYC application is undergoing a manual review by the provider. This may take some time.',
    manual_review:
      '👩‍💻 Your KYC application is undergoing a manual review. We will notify you once the review is complete.',
    provider_on_hold:
      '⏸️ Your KYC application is on hold by the provider. Please contact support for further assistance.',
    on_hold:
      '⏸️ Your KYC application is on hold. Please contact support for further assistance.',
    expired:
      '⌛ Your KYC application has expired. Please submit a new application to proceed.',
    approved:
      '🎉 Your KYC application has been approved! You’re all set to proceed.',
    rejected:
      '❌ Your KYC application was rejected. Please update your information and try again.',
  };

  @Action(Actions.KYC)
  async handleKyc(@Ctx() ctx: Context) {
    ctx.answerCbQuery('🔃 Checking Kyc Status');
    const accessToken = ctx.session.auth?.access_token || '';

    try {
      // Fetch KYC status
      const kycs = await this.kycService.listKycs(accessToken);

      // Check if there are any successful KYC application
      if (!kycs.data.length) {
        await ctx.replyWithMarkdownV2(
          '*🛡️ KYC*\n\nNo KYC application found\\.',
          {
            reply_markup: Markup.inlineKeyboard([
              [
                Markup.button.url(
                  '🔒 Complete Kyc',
                  'https://payout.copperx.io/app/kyc',
                ),
                Markup.button.callback('🔃 Refresh', Actions.KYC),
              ],
              [Markup.button.callback('❌ Close', Actions.CLOSE)],
            ]).reply_markup,
          },
        );
        return;
      }

      // Check if any KYC application is approved
      const anySucessfulKyc = kycs.data.some(
        (kyc) => kyc.status === 'approved',
      );

      // If no KYC application is approved, show the first KYC application
      if (!anySucessfulKyc) {
        const kyc = kycs.data?.[0];
        const kycUrl =
          kyc?.kycDetail?.kycUrl || 'https://payout.copperx.io/app/kyc';
        const message = this.statusMessages[kyc?.status || 'pending'];

        await ctx.replyWithMarkdownV2(
          `*🛡️ KYC*\n\n${escapeMarkdownV2(message)}`,
          {
            reply_markup: Markup.inlineKeyboard([
              [
                Markup.button.url('🔒 Complete Kyc', kycUrl),
                Markup.button.callback('🔃 Refresh', Actions.KYC),
              ],
              [Markup.button.callback('❌ Close', Actions.CLOSE)],
            ]).reply_markup,
          },
        );
        return;
      }

      // If any KYC application is approved, show the approved message
      await ctx.replyWithMarkdownV2(
        `*🛡️ KYC*\n\n${escapeMarkdownV2(this.statusMessages['approved'])}`,
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('🔃 Refresh', Actions.KYC)],
            [Markup.button.callback('❌ Close', Actions.CLOSE)],
          ]).reply_markup,
        },
      );
      return;
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      await ctx.reply(
        'An error occurred while fetching your KYC status. Please try again later.',
      );
    }
  }
}
