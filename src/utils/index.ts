export function escapeMarkdownV2(text: string): string {
  // Regex to match all special characters that need to be escaped in MarkdownV2
  const specialCharsRegex = /([_*\[\]()~`>#\+\-=|{}.!])/g;

  // Replace each special character with its escaped version
  return text.replace(specialCharsRegex, '\\$1');
}
