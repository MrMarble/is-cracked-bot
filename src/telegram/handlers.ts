import { BotCommand } from 'telegraf/typings/telegram-types';
import { TelegrafContext } from 'telegraf/typings/context';
import { getGame } from '../crackwatch/websocket';

interface Command {
  handler(ctx: TelegrafContext): void;
  command: BotCommand;
}

export const Commands: Array<Command> = [
  {
    handler: handleStart,
    command: {
      command: 'start',
      description: 'Displays info about the bot',
    },
  },
  {
    handler: handleGetGameInfo,
    command: {
      command: 'game',
      description: '<game name> Displays info about a game',
    },
  },
];

function handleStart(ctx: TelegrafContext): void {
  ctx.reply(
    'Telegram bot made by <a href="tg://user?id=256671105">MrMarble</a>',
    { parse_mode: 'HTML' },
  );
}

function handleGetGameInfo(ctx: TelegrafContext): void {
  getGame(ctx);
}
