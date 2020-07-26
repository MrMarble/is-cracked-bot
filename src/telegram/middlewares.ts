import { TelegrafContext } from 'telegraf/typings/context';
import { UserModel } from './../database/users/users.model';
import { logger } from '../main';

export const middlewares = [loggerWare, createUserWare];

async function loggerWare(
  ctx: TelegrafContext,
  next: () => Promise<void>,
): Promise<void> {
  logger.debug('update received', {
    module: 'telegram',
    type: ctx.updateType,
    from: ctx.from?.id,
    subtypes: ctx.updateSubTypes,
  });
  next();
}

async function createUserWare(
  ctx: TelegrafContext,
  next: () => Promise<void>,
): Promise<void> {
  try {
    const user = await UserModel.findOneOrCreate({
      userId: ctx.from?.id,
      userName: ctx.from?.username,
      firstName: ctx.from?.first_name,
    });
    await user.setLastUpdated();
    // @ts-ignore: The recommended way is not even declared
    ctx.state.user = user;
  } catch (error) {
    logger.error('error creating user', {
      module: 'middlewares',
      error: error.message,
    });
  }
  next();
}
