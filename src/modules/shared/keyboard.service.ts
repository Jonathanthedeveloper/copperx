import { Injectable } from '@nestjs/common';
import { Actions } from 'src/enums/actions.enums';
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
}
