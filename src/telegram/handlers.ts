import {
  BotCommand,
  InlineQueryResultArticle,
  User,
} from 'telegraf/typings/telegram-types';

import { Channel } from './../utils/channel';
import { CustomContext } from './telegram';
import { GameModel } from '../database/games/games.model';
import { IGameDocument } from './../database/games/games.types';
import { Markup } from 'telegraf';
import { getGame } from '../crackwatch/methods';
import { logger } from '../main';

interface Command {
  handler(ctx: CustomContext): void;
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
  {
    handler: handleSearchGame,
    command: {
      command: 'search',
      description: '<game name> Displays results for a name search',
    },
  },
];

function handleStart(ctx: CustomContext): void {
  logger.info('handle start command', {
    module: 'telegram/handlers',
    from: ctx.from.id,
  });
  if (!ctx.state.user.dateOfRegistry) {
    logger.info('user registered', { user: ctx.state.user.userId });
    ctx.state.user.dateOfRegistry = new Date();
    ctx.state.user.save();
  }
  ctx.reply(
    'Telegram bot made by <a href="tg://user?id=256671105">MrMarble</a>',
    { parse_mode: 'HTML' },
  );
}

async function handleGetGameInfo(ctx: CustomContext): Promise<void> {
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

async function handleSearchGame(ctx: CustomContext): Promise<void> {
  logger.info('handle search command', {
    module: 'telegram/handlers',
    from: ctx.from.id,
    text: ctx.message.text,
  });
  const query = ctx.message.text.substr('/search'.length).trim();
  if (query) {
    ctx.reply(`buscamos el juego ${query}`);
  } else {
    ctx.reply(
      `para buscar de manera dinamica usa @${ctx.me} <nombre a buscar>`,
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.switchToCurrentChatButton('Buscar', 'search'),
        ]),
      },
    );
  }
}

export async function handleInlineQuery(ctx: CustomContext): Promise<void> {
  logger.info('handle inline query', {
    module: 'telegram/handlers',
    from: ctx.from.id,
    query: ctx.inlineQuery.query,
  });
  let results: InlineQueryResultArticle[];
  if (ctx.inlineQuery.query.length < 3) {
    results = [
      {
        type: 'article',
        title: 'prueba',
        id: 'random',
        input_message_content: {
          message_text: 'prueba 2',
        },
        reply_markup: Markup.inlineKeyboard([
          Markup.urlButton('search game', 'www.google.es'),
        ]),
      },
    ];
  }
  ctx.answerInlineQuery(results);
}
