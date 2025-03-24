import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Actions } from 'src/enums/actions.enums';
import { Context, Markup } from 'telegraf';
import { PointsService } from './points.service';
import { escapeMarkdownV2, handleErrorResponses } from 'src/utils';
import { RequireAuth } from '../auth/auth.decorator';
import { Commands } from 'src/enums/commands.enum';

@Update()
@RequireAuth()
export class PointUpdate {
  constructor(private readonly pointService: PointsService) {}

  @Action(Actions.POINTS)
  async points(@Ctx() ctx: Context) {
    ctx.answerCbQuery('🔃 Fetching your points...');

    await this.fetchpoints(ctx);
  }

  @Command(Commands.POINTS)
  async pointsCommand(@Ctx() ctx: Context) {
    const [message] = await Promise.allSettled([
      ctx.reply('🔃 Fetching your points...'),
      this.fetchpoints(ctx),
    ]);

    if (message.status === 'fulfilled') {
      await ctx.deleteMessage(message.value.message_id);
    }
  }

  async fetchpoints(ctx) {
    const accessToken = ctx.session.auth?.access_token ?? '';
    try {
      // Fetch total points and all points
      const [totalPoints, allPoints] = await Promise.all([
        this.pointService.getTotalPoints(accessToken),
        this.pointService.getAllPoints(accessToken),
      ]);

      // Format the points message
      const message = this.formatPointsMessage(allPoints, totalPoints.total);

      const xUrl =
        'https://x.com/share?url=https%3A%2F%2Fcopperx.io%2Fpoints&text=Just%20minted%20100%20points%20with%20Copperx%20Mint!%20%23CopperxMint%0A%0AMint%20points%20for%20every%20payment%2C%20off-ramp%2C%20and%20community%20engagement.%20%F0%9F%92%8E%E2%9C%A8%0A%0ACheck%20out%20how%20you%20can%20start%20minting%20points%20today%3A';

      // Send the formatted message
      await ctx.replyWithMarkdownV2(message, {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Refresh', Actions.POINTS)],
          [Markup.button.url('Share on X', xUrl)],
          [Markup.button.callback('❌ Close', Actions.CLOSE)],
        ]).reply_markup,
      });
    } catch (error) {
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage:
          '🛑 An error occurred while fetching your points. Please try again later.',
        buttons: [{ text: '🔄 Retry', action: Actions.POINTS }],
      });
    }
  }

  private formatPointsMessage(points, totalPoints: number) {
    let message = `*🏆 Your Points Summary* \n\n`;

    // Total Points
    message += `*✨ Total Points:* \`${escapeMarkdownV2(totalPoints.toString())}\` \n\n`;

    // Off-Ramp Transfer Points
    if (points.offrampTransferPoints.data.length > 0) {
      message += `*💸 Off\\-Ramp Transfer Points:* \n`;
      points.offrampTransferPoints.data.forEach((point, index) => {
        message += `  *${index + 1}.* Amount: \`$${escapeMarkdownV2(point.amountUSD)}\` \n`;
        message += `     Transactions: \`${escapeMarkdownV2(point.noOfTransactions)}\` \n`;
        message += `     Multiplier: \`${escapeMarkdownV2(point.multiplier)}x\` \n`;
        message += `     Points: \`${escapeMarkdownV2(point.points)}\` \n\n`;
      });
    } else {
      message += `*💸 Off\\-Ramp Transfer Points:* \n`;
      message += `   No off\\-ramp transfer points found\\. \n\n`;
    }

    // Referral Points
    if (points.payoutReferralPoints.data.length > 0) {
      message += `*🤝 Referral Points:* \n`;
      points.payoutReferralPoints.data.forEach((referral, index) => {
        message += `  *${index + 1}.* Reference: \`${escapeMarkdownV2(referral.reference)}\` \n`;
        message += `     Total Points: \`${escapeMarkdownV2(referral.totalPoints)}\` \n`;
        message += `     Transaction Points: \`${escapeMarkdownV2(referral.transactionPoints)}\` \n`;
        message += `     Referral Points: \`${escapeMarkdownV2(referral.referralPoints)}\` \n`;
        message += `     Total Transactions: \`${escapeMarkdownV2(referral.totalTransactions)}\` \n\n`;
      });
    } else {
      message += `*🤝 Referral Points:* \n`;
      message += `   No referral points found\\. \n\n`;
    }

    return message;
  }
}
