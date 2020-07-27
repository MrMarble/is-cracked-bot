import { BotCommand } from 'telegraf/typings/telegram-types';
import { Channel } from './../utils/channel';
import { GameModel } from '../database/games/games.model';
import { IGameDocument } from './../database/games/games.types';
import { TelegrafContext } from 'telegraf/typings/context';
import { getGame } from '../crackwatch/methods';
import { logger } from '../main';

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
  logger.info('handle start command', {
    module: 'telegram/handlers',
    from: ctx.from.id,
  });
  ctx.reply(
    'Telegram bot made by <a href="tg://user?id=256671105">MrMarble</a>',
    { parse_mode: 'HTML' },
  );
}

async function handleGetGameInfo(ctx: TelegrafContext): Promise<void> {
  logger.info('handle game command', {
    module: 'telegram/handlers',
    from: ctx.from.id,
    text: ctx.message.text,
  });

  const gameName = ctx.message.text.substr('/game'.length).trim();
  const games = await GameModel.findByName(gameName);
  let game: IGameDocument;

  if (games.length == 0) {
    const chnl = new Channel<IGameDocument>();
    getGame(gameName, chnl);
    game = await chnl.recv();
  } else {
    game = games[0];
  }
  ctx.reply(game.getGameCard(), { parse_mode: 'HTML' });
}
