import { Action, Update } from 'nestjs-telegraf';
import { Actions } from 'src/enums/actions.enums';
import { Context } from 'telegraf';
import { SceneContext, WizardContext } from 'telegraf/typings/scenes';
import { DEPOSIT_SCENE_ID } from './deposit.scene';
import { RequireAuth } from '../auth/auth.decorator';

@Update()
@RequireAuth()
export class DepositUpdate {
  constructor() {}

  @Action(Actions.DEPOSIT)
  async onDeposit(ctx: WizardContext) {
    ctx.scene.enter(DEPOSIT_SCENE_ID);
  }
}
