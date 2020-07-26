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
    logger.info('user created / updated', {
      module: 'middlewares',
      userId: user.userId,
      firstName: user.firstName,
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ctx.state.user = user; // The recommended way is not even declared :roll_eyes:
  } catch (error) {
    logger.error('error creating user', {
      modue: 'middlewares',
      error: error.message,
    });
  }
  next();
}
