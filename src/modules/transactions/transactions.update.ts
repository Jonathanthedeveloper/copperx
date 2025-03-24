import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Actions } from 'src/enums/actions.enums';
import { Context, Markup } from 'telegraf';
import { TransactionsService } from './transactions.service';
import { escapeMarkdownV2, handleErrorResponses } from 'src/utils';
import { RequireAuth } from '../auth/auth.decorator';
import { Commands } from 'src/enums/commands.enum';

@Update()
@RequireAuth()
export class TransactionUpdate {
  constructor(private readonly transactionService: TransactionsService) {}

  @Action(Actions.TRANSACTIONS)
  async handleTransactionAction(@Ctx() ctx: Context) {
    ctx.answerCbQuery('🔃 Fetching Transactions');
    await this.listTransactions(ctx);
  }

  @Command(Commands.TRANSACTIONS)
  async handleTransactionsCommand(@Ctx() ctx: Context) {
    const [message] = await Promise.allSettled([
      ctx.reply('🔃 Fetching Your Transaction History...'),
      this.listTransactions(ctx),
    ]);

    if (message.status === 'fulfilled') {
      await ctx.deleteMessage(message.value.message_id);
    }
  }

  async listTransactions(ctx) {
    try {
      // Fetch the first page of transactions
      const transactions = await this.transactionService.getAllTransactions(
        ctx.session.auth?.access_token ?? '',
        { page: 1, limit: 10 },
      );

      if (transactions.data.length === 0) {
        await ctx.replyWithMarkdownV2(
          '📃 *Transactions*\n\n❌ No transactions found\\.',
          {
            reply_markup: Markup.inlineKeyboard([
              [Markup.button.callback('🔃 Refresh', 'REFRESH:1')],
              [Markup.button.callback('❌ Close', Actions.CLOSE)],
            ]).reply_markup,
          },
        );
        return;
      }

      // Format the transactions into a message
      const transactionList = transactions.data
        .map((tx, index) => {
          const date = new Date(tx.createdAt);
          const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
          return (
            `*${index + 1}\\. ${escapeMarkdownV2(tx.type.toUpperCase())}*\n` +
            `📅 *Date:* ${escapeMarkdownV2(formattedDate)}\n` +
            `💸 *Amount:* ${escapeMarkdownV2(tx.fromAmount)} ${escapeMarkdownV2(tx.fromCurrency)}\n` +
            `🔄 *Status:* ${escapeMarkdownV2(tx.status)}\n` +
            `\\-\\-\\-`
          );
        })
        .join('\n');

      const message = `📋 *Transactions*\n\n${transactionList}`;

      // Create inline keyboard with actions
      const keyboardButtons = [
        [Markup.button.callback('🔃 Refresh', `REFRESH:1`)], // Pass the current page number
      ];

      // Add "Fetch More" button only if hasMore is true
      if (transactions.hasMore) {
        keyboardButtons[0].push(
          Markup.button.callback('📥 Fetch More', 'FETCH_MORE:2'),
        ); // Pass the next page number
      }

      keyboardButtons.push([Markup.button.callback('❌ Close', Actions.CLOSE)]);

      const keyboard = Markup.inlineKeyboard(keyboardButtons);

      await ctx.replyWithMarkdownV2(message, {
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      console.log(error);
      await handleErrorResponses({
        ctx,
        defaultMessage: 'Failed to fetch transactions',
        error,
        buttons: [{ text: '🔃 Retry', action: Actions.TRANSACTIONS }],
      });
    }
  }

  @Action(/^FETCH_MORE:(\d+)$/)
  async fetchMoreTransactions(@Ctx() ctx: Context) {
    ctx.answerCbQuery('🔃 Fetching More Transactions');

    // Extract the page number from the callback data
    // @ts-expect-error
    const page = parseInt(ctx.callbackQuery?.data?.split(':')[1] || '1', 10);

    try {
      // Fetch the next page of transactions
      const transactions = await this.transactionService.getAllTransactions(
        ctx.session.auth?.access_token ?? '',
        { page, limit: 10 },
      );

      if (transactions.data.length === 0) {
        await ctx.replyWithMarkdownV2('No more transactions found\\.');
        return;
      }

      // Format the transactions into a message
      const transactionList = transactions.data
        .map(
          (tx, index) =>
            `*${index + 1}\\. ${escapeMarkdownV2(tx.type.toUpperCase())}*\n` +
            `📅 *Date:* ${escapeMarkdownV2(new Date(tx.createdAt).toLocaleString())}\n` +
            `💸 *Amount:* ${escapeMarkdownV2(tx.fromAmount)} ${escapeMarkdownV2(tx.fromCurrency)}\n` +
            `🔄 *Status:* ${escapeMarkdownV2(tx.status)}\n` +
            `\\-\\-\\-`,
        )
        .join('\n');

      const message = `📋 *Transactions \\(Page ${page}\\)*\n\n${transactionList}`;

      // Create inline keyboard with actions
      const keyboardButtons = [
        [Markup.button.callback('🔃 Refresh', `REFRESH:${page}`)], // Pass the current page number
      ];

      // Add "Fetch More" button only if hasMore is true
      if (transactions.hasMore) {
        keyboardButtons[0].push(
          Markup.button.callback('📥 Fetch More', `FETCH_MORE:${page + 1}`),
        ); // Pass the next page number
      }

      keyboardButtons.push([Markup.button.callback('❌ Close', Actions.CLOSE)]);

      const keyboard = Markup.inlineKeyboard(keyboardButtons);

      await ctx.replyWithMarkdownV2(message, {
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      await handleErrorResponses({
        ctx,
        defaultMessage:
          '📃 *Transactions*\n\n❌ Failed to fetch more transactions\\. Please try again\\.',
        error,
        buttons: [{ text: '🔃 Retry', action: `REFRESH:${page}` }],
        header: 'Error fetching more transactions',
        prefix: '📃 *Transactions*\n\n❌',
      });
    }
  }

  @Action(/^REFRESH:(\d+)$/)
  async refreshTransactions(@Ctx() ctx: Context) {
    ctx.answerCbQuery('🔃 Refreshing Transactions');

    // Extract the page number from the callback data
    //@ts-expect-error
    const page = parseInt(ctx.callbackQuery?.data?.split(':')[1] || '1', 10);

    try {
      // Fetch the transactions for the current page
      const transactions = await this.transactionService.getAllTransactions(
        ctx.session.auth?.access_token ?? '',
        { page, limit: 10 },
      );

      if (transactions.data.length === 0) {
        const message =
          page === 1 ? 'No transactions found.' : 'No more transactions found.';
        await ctx.replyWithMarkdownV2(
          `📃 *Transactions*\n\n${escapeMarkdownV2(message)}`,
          {
            reply_markup: Markup.inlineKeyboard([
              [Markup.button.callback('🔃 Refresh', `REFRESH:${page}`)],
              [Markup.button.callback('❌ Close', Actions.CLOSE)],
            ]).reply_markup,
          },
        );
        return;
      }

      // Format the transactions into a message
      const transactionList = transactions.data
        .map(
          (tx, index) =>
            `*${index + 1}\\. ${escapeMarkdownV2(tx.type.toUpperCase())}*\n` +
            `📅 *Date:* ${escapeMarkdownV2(new Date(tx.createdAt).toLocaleString())}\n` +
            `💸 *Amount:* ${escapeMarkdownV2(tx.fromAmount)} ${escapeMarkdownV2(tx.fromCurrency)}\n` +
            `🔄 *Status:* ${escapeMarkdownV2(tx.status)}\n` +
            `\\-\\-\\-`,
        )
        .join('\n');

      const message = `*📋 Transactions \\(Page ${page}\\)*\n\n${transactionList}`;

      // Create inline keyboard with actions
      const keyboardButtons = [
        [Markup.button.callback('🔃 Refresh', `REFRESH:${page}`)], // Pass the current page number
      ];

      // Add "Fetch More" button only if hasMore is true
      if (transactions.hasMore) {
        keyboardButtons[0].push(
          Markup.button.callback('📥 Fetch More', `FETCH_MORE:${page + 1}`),
        ); // Pass the next page number
      }

      keyboardButtons.push([Markup.button.callback('❌ Close', Actions.CLOSE)]);

      const keyboard = Markup.inlineKeyboard(keyboardButtons);

      await ctx.replyWithMarkdownV2(message, {
        reply_markup: keyboard.reply_markup,
      });
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      await handleErrorResponses({
        ctx,
        error,
        defaultMessage: 'Failed to refresh transactions',
        buttons: [{ text: '🔃 Retry', action: `REFRESH:${page}` }],
        header: 'Error refreshing transactions',
        prefix: '📃 *Transactions*\n\n❌',
      });
    }
  }
}
