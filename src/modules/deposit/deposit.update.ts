import { Action, Command, Ctx, Update } from 'nestjs-telegraf';
import { Actions } from 'src/enums/actions.enums';
import { WizardContext } from 'telegraf/typings/scenes';
import { DEPOSIT_SCENE_ID } from './deposit.scene';
import { RequireAuth } from '../auth/auth.decorator';
import { Commands } from 'src/enums/commands.enum';

@Update()
@RequireAuth()
export class DepositUpdate {
  constructor() {}

  @Action(Actions.DEPOSIT)
  async onDeposit(@Ctx() ctx: WizardContext) {
    ctx.answerCbQuery('🔃 Fetching Available Networks');
    ctx.scene.enter(DEPOSIT_SCENE_ID);
  }

  @Command(Commands.Deposit)
  async handleDeposit(@Ctx() ctx: WizardContext) {
    ctx.scene.enter(DEPOSIT_SCENE_ID);
  }
}
