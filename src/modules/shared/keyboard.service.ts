import { Injectable } from '@nestjs/common';
import { Actions } from 'src/enums/actions.enums';
import { Wallet } from 'src/types';
import { Markup } from 'telegraf';

@Injectable()
export class KeyboardsService {
  getMainKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📤 Send Funds', Actions.TRANSFER),
        Markup.button.callback('📥 Deposit', Actions.DEPOSIT),
        Markup.button.callback('📈 Wallet', Actions.WALLET),
      ],
      [
        Markup.button.callback('👤 Profile', Actions.PROFILE),
        Markup.button.callback('🛡️ KYC', Actions.KYC),
      ],
      [
        Markup.button.callback('👥 Recipients', Actions.PAYEE),
        Markup.button.callback('📃 Transactions', Actions.TRANSACTIONS),
      ],
      [
        Markup.button.callback('🪙 View Points', Actions.POINTS),
        Markup.button.callback('📢 Referrals', Actions.REFERRALS),
      ],
      [Markup.button.callback('🚪 Logout', Actions.LOGOUT)],
      [
        Markup.button.callback('📜 Help', Actions.HELP),
        Markup.button.url('🆘 Support', 'https://t.me/copperxcommunity/2183'),
      ],
      [
        Markup.button.url(
          '📄 Terms & Conditions',
          'https://copperx.io/terms-of-service',
        ),
      ],
      [Markup.button.callback('❌ Close', Actions.CLOSE)],
    ]);
  }

  getUnauthenticatedKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔑 Login with Email', Actions.LOGIN)],
      [
        Markup.button.callback('📜 Help', Actions.HELP),
        Markup.button.url('🆘 Support', 'https://t.me/copperxcommunity/2183'),
      ],
      [
        Markup.button.url(
          '📄 Terms & Conditions',
          'https://copperx.io/terms-of-service',
        ),
      ],
      [Markup.button.callback('❌ Close', Actions.CLOSE)],
    ]);
  }

  getProfileKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Refresh', Actions.PROFILE)],
      [Markup.button.callback('🚪 Logout', Actions.LOGOUT)],
      [Markup.button.callback('❌ Close', Actions.CLOSE)],
    ]);
  }

  getWalletKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(
          'Set Default Wallet',
          Actions.SET_DEFAULT_WALLET,
        ),
      ],
      [Markup.button.callback('🔄 Refresh', 'WALLET')],
      [Markup.button.callback('❌ Close', Actions.CLOSE)],
    ]);
  }

  getWalletSelectionKeyboard(
    wallets: Wallet[],
  ): ReturnType<typeof Markup.inlineKeyboard> {
    const buttons = wallets.map((wallet) => [
      Markup.button.callback(
        `📌 ${wallet.network} (${wallet.walletAddress.slice(0, 4)}...${wallet.walletAddress.slice(-4)}) ${wallet.isDefault ? '✅' : ''} `,
        `set_default_wallet_${wallet.id}`,
      ),
    ]);
    buttons.push([Markup.button.callback('❌ Close', Actions.CLOSE)]);
    return Markup.inlineKeyboard(buttons);
  }
  getConfirmTransferKeyboard({
    confirmCallback,
  }: {
    confirmCallback: string;
  }): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('📧 Confirm', confirmCallback)],
      [Markup.button.callback('🏠 Back to Menu', 'start')],
      [Markup.button.callback('❌ Close', Actions.CLOSE)],
    ]);
  }

  getFundTransferKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('📧 Send to Email', Actions.TRANSFER_TO_EMAIL)],
      [Markup.button.callback('🔑 Send to Wallet', Actions.TRANSFER_TO_WALLET)],
      [
        Markup.button.callback(
          '🏦 Withdraw to Bank',
          Actions.TRANSFER_TO_BANK_ACCOUNT,
        ),
      ],
      [
        Markup.button.callback(
          'View Last 10 Transactions',
          Actions.TRANSFER_HISTORY,
        ),
      ],
      [Markup.button.callback('❌ Close', Actions.CLOSE)],
    ]);
  }
}
