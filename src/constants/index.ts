import { Commands } from 'src/enums/commands.enum';

type CommandDescriptions = {
  [key in Commands]: string;
};

export const commandDescriptions: CommandDescriptions = {
  [Commands.Login]: '/login - Authenticate with the bot',
  [Commands.Logout]: '/logout - Log out from the bot',
  [Commands.Deposit]: '/deposit - Deposit funds into your account',
  [Commands.Profile]: '/profile - View your profile information',
  [Commands.Close]: '/close - Close the current conversation',
  [Commands.Cancel]: '/cancel - Cancel the current operation',
  [Commands.KYC]: '/kyc - Complete your KYC verification',
  [Commands.PAYEE]: '/recipients - Manage your payees',
  [Commands.ADD_PAYEE]: '/add_recipient - Add a new payee',
  [Commands.REMOVE_PAYEE]: '/remove_recipient - Remove an existing payee',
  [Commands.POINTS]: '/points - Check your points balance',
  [Commands.REFERRALS]: '/referrals - View your referral information',
  [Commands.TRANSFER]: '/transfer - Transfer funds to another account',
  [Commands.TRANSFER_TO_EMAIL]:
    '/transfer_to_email - Transfer funds to an email address',
  [Commands.TRANSFER_TO_WALLET]:
    '/transfer_to_wallet - Transfer funds to a wallet',
  [Commands.TRANSFER_TO_BANK_ACCOUNT]:
    '/transfer_to_bank_account - Transfer funds to a bank account',
  [Commands.TRANSFER_HISTORY]: '/transfer_history - View your transfer history',
  [Commands.WALLET]: '/wallet - Manage your wallet',
  [Commands.SET_DEFAULT_WALLET]:
    '/set_default_wallet - Set your default wallet',
  [Commands.TRANSACTIONS]: '/transactions - View your transaction history',
  [Commands.HELP]: '/help - Get help with using the bot',
  [Commands.MAIN_MENU]: '/main_menu - Go back to the main menu',
};
