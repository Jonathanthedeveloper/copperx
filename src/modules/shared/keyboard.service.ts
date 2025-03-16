import { Injectable } from '@nestjs/common';
import { Actions } from 'src/enums/actions.enums';
import { Wallet } from 'src/types';
import { Markup } from 'telegraf';

@Injectable()
export class KeyboardsService {
  getMainKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📈 Wallet', Actions.WALLET),
        Markup.button.callback('↗️ Transfer', Actions.TRANSFER),
        Markup.button.callback('⬇️ Deposit', Actions.DEPOSIT),
      ],
      [
        Markup.button.callback('👤 Profile', Actions.PROFILE),
        Markup.button.callback('KYC', Actions.KYC),
      ],
      [Markup.button.callback('Logout', Actions.LOGOUT)],
      [
        Markup.button.callback('📜 Help', 'help'),
        Markup.button.url('🆘 Support', 'https://t.me/copperxcommunity/2183'),
      ],
      [Markup.button.callback('📄 Terms & Conditions', 'TERMS')],
    ]);
  }

  getUnauthenticatedKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔑 Login with Copperx', Actions.LOGIN)],
      [
        Markup.button.callback('📜 Help', 'help'),
        Markup.button.url('🆘 Support', 'https://t.me/copperxcommunity/2183'),
      ],
      [Markup.button.callback('📄 Terms & Conditions', 'TERMS')],
    ]);
  }

  getProfileKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Refresh', Actions.PROFILE)],
      [Markup.button.callback('🚪 Logout', Actions.LOGOUT)],
      [Markup.button.callback('🏠 Back to Menu', 'start')],
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
      [Markup.button.callback('🏠 Back to Menu', 'start')],
    ]);
  }

  getWalletSelectionKeyboard(
    wallets: Wallet[],
  ): ReturnType<typeof Markup.inlineKeyboard> {
    const buttons = wallets.map((wallet) => [
      Markup.button.callback(
        `📌 ${wallet.walletAddress} (${wallet.network})`,
        `set_default_wallet_${wallet.id}`,
      ),
    ]);
    buttons.push([Markup.button.callback('🏠 Back to Menu', 'start')]);
    return Markup.inlineKeyboard(buttons);
  }
}
