import { Commands } from './handlers';
import { Telegraf } from 'telegraf';
import { TelegrafContext } from 'telegraf/typings/context';
import { logger } from '../main';
import { middlewares } from './middlewares';

export const newBot = async (
  token: string,
): Promise<Telegraf<TelegrafContext>> => {
  const bot = new Telegraf(token);

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

export const start = (bot: Telegraf<TelegrafContext>): void => {
  registerHandlers(bot);

  logger.info('start polling', { module: 'telegram' });

  bot.launch();
};

const registerHandlers = (bot: Telegraf<TelegrafContext>) => {
  logger.info('registering handlers', { module: 'telegram' });

  for (const handler of Commands) {
    bot.command(handler.command.command, handler.handler);
  }
  const tmpCommands = Commands.map((cmd) => cmd.command);
  bot.telegram.setMyCommands(tmpCommands);
};
