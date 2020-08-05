import { Commands } from './handlers/commands';
import { IUserDocument } from './../database/users/users.types';
import { Telegraf } from 'telegraf';
import { TelegrafContext } from 'telegraf/typings/context';
// TODO: Something about telegraf-i18n is typed wrong. It requires esModuleInterop to work…
import TelegrafI18n from 'telegraf-i18n';
import { handleInlineQuery } from './handlers/callbacks';
import { logger } from '../main';
import { middlewares } from './middlewares';

const i18n = new TelegrafI18n({
  defaultLanguage: 'en',
  allowMissing: false,
  directory: 'locales',
});

export interface CustomContext extends TelegrafContext {
  state: { user: IUserDocument };
  startPayload?: string;
  i18n: TelegrafI18n;
}

let bot: Telegraf<CustomContext>;

export const newBot = async (token: string): Promise<Telegraf<CustomContext>> => {
  bot = new Telegraf(token);

  bot.catch((err: Error) => {
    logger.error('telegraf internal error', { err: err.message });
  });

  logger.info('registering middlewares', { module: 'telegram' });
  bot.use(i18n.middleware());
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
    if (handler.private) break;
    bot.command(handler.command.command, handler.handler);
  }
  const tmpCommands = Commands.filter((c) => !c?.private).map((cmd) => cmd.command);
  bot.telegram.setMyCommands(tmpCommands);

  // Inline
  bot.on('inline_query', handleInlineQuery);
};
