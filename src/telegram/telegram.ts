import { Commands, handleInlineQuery } from './handlers';

import { IUserDocument } from './../database/users/users.types';
import { Telegraf } from 'telegraf';
import { TelegrafContext } from 'telegraf/typings/context';
import { logger } from '../main';
import { middlewares } from './middlewares';

export interface CustomContext extends TelegrafContext {
  state: { user: IUserDocument };
}

let bot: Telegraf<CustomContext>;

export const newBot = async (
  token: string,
): Promise<Telegraf<CustomContext>> => {
  bot = new Telegraf(token);

  bot.catch((err: Error) => {
    logger.error('telegraf internal error', { err });
  });

  logger.info('registering middlewares', { module: 'telegram' });
  bot.use(...middlewares);

  const me = await bot.telegram.getMe();

  logger.info('connected to telegram', {
    module: 'telegram',
    id: me.id,
    name: me.first_name,
    username: me.username,
  });

  return bot;
};

export const start = (bot: Telegraf<CustomContext>): void => {
  registerHandlers(bot);

  logger.info('start polling', { module: 'telegram' });

  bot.launch();
};

const registerHandlers = (bot: Telegraf<CustomContext>) => {
  logger.info('registering handlers', { module: 'telegram' });

  // Commands
  for (const handler of Commands) {
    bot.command(handler.command.command, handler.handler);
  }
  const tmpCommands = Commands.map((cmd) => cmd.command);
  bot.telegram.setMyCommands(tmpCommands);

  // Inline
  bot.on('inline_query', handleInlineQuery);
};
