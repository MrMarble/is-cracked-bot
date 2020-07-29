import { CustomContext } from './telegram';
import { MemoryStore } from '../utils/memory-store';
import { UserModel } from './../database/users/users.model';
import { logger } from '../main';

export const middlewares = [rateLimitWare, loggerWare, createUserWare];

async function loggerWare(ctx: CustomContext, next: () => Promise<void>): Promise<void> {
  logger.debug('update received', {
    module: 'telegram',
    type: ctx.updateType,
    from: ctx.from?.id,
    subtypes: ctx.updateSubTypes,
  });
  next();
}

async function createUserWare(ctx: CustomContext, next: () => Promise<void>): Promise<void> {
  try {
    const user = await UserModel.findOneOrCreate({
      userId: ctx.from?.id,
      userName: ctx.from?.username,
      firstName: ctx.from?.first_name,
    });
    await user.setLastUpdated();
    ctx.state.user = user;
  } catch (error) {
    logger.error('error creating user', {
      module: 'middlewares',
      error: error.message,
    });
  }
  next();
}

const store = new MemoryStore(1500);
async function rateLimitWare(ctx: CustomContext, next: () => Promise<void>): Promise<void> {
  const key: string = ctx.from?.id.toString();
  if (!key) {
    return next();
  }
  const hit = store.incr(key);
  if (hit <= 1) {
    return next();
  }
  return;
}
