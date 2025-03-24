import { Actions } from 'src/enums/actions.enums';
import { Markup } from 'telegraf';

export function escapeMarkdownV2(text: string): string {
  if (typeof text !== 'string') {
    return text;
  }

  // Regex to match all special characters that need to be escaped in MarkdownV2
  const specialCharsRegex = /([_*\[\]()~`>#\+\-=|{}.!])/g;

  // Replace each special character with its escaped version
  return text.replace(specialCharsRegex, '\\$1');
}

interface ErrorButton {
  text: string;
  action: string;
}

interface ErrorResponseOptions {
  error: any;
  defaultMessage: string;
  ctx: any;
  buttons?: ErrorButton[];
  prefix?: string;
  header?: string;
}
export async function handleErrorResponses({
  error,
  defaultMessage,
  ctx,
  buttons = [],
  prefix = '🛑',
  header,
}: ErrorResponseOptions) {
  const errorMessage = error?.response?.data?.message || defaultMessage;

  // Add common action buttons based on context
  let finalButtons = [...buttons];

  // Check if we are in a scene
  if (!ctx.scene?.current) {
    finalButtons.push({ text: '❌ Close', action: Actions.CLOSE });
  }

  // Only add cancel button if we are in a scene since there would be nothing to cancel otherwise
  if (ctx.scene?.current) {
    finalButtons.push({ text: '🚫 Cancel', action: Actions.CANCEL });
  }

  const keyboard = finalButtons.map((btn) => [
    Markup.button.callback(btn.text, btn.action),
  ]);

  const message = header
    ? `${escapeMarkdownV2(header)}\n\n${prefix} ${escapeMarkdownV2(errorMessage)}`
    : `${prefix} ${escapeMarkdownV2(errorMessage)}`;

  await ctx.replyWithMarkdownV2(message, {
    reply_markup: Markup.inlineKeyboard(keyboard).reply_markup,
  });
}
