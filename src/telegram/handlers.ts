import { BotCommand, InlineQueryResult, InlineQueryResultArticle } from 'telegraf/typings/telegram-types';
import { getGame, searchGame } from '../crackwatch/methods';

import { Channel } from './../utils/channel';
import { CustomContext } from './telegram';
import { GameModel } from '../database/games/games.model';
import { IGameDocument } from './../database/games/games.types';
import { Markup } from 'telegraf';
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

async function handleStart(ctx: CustomContext): Promise<void> {
  logger.info('handle start command', {
    module: 'telegram/handlers',
    from: ctx.from.id,
  });
  if (!ctx.state.user.dateOfRegistry) {
    logger.info('user registered', { user: ctx.state.user.userId });
    ctx.state.user.dateOfRegistry = new Date();
    await ctx.state.user.save();
  }
  ctx.startPayload = ctx.message.text.substring(7);
  if (ctx.startPayload) {
    const [method, payload] = ctx.startPayload.split('_');
    switch (method) {
      case 'sub':
        handleSub(ctx, payload);
        ctx.reply('Subscribed!');
        break;
      case 'unsub':
        handleSub(ctx, payload);
        ctx.reply('Unsubscribed!');
        break;
      default:
        break;
    }
  }
  ctx.reply('Telegram bot made by <a href="tg://user?id=256671105">MrMarble</a>', { parse_mode: 'HTML' });
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
    chnl.close();
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
    ctx.reply(`para buscar de manera dinamica usa @${ctx.me} <nombre a buscar>`, {
      reply_markup: Markup.inlineKeyboard([Markup.switchToCurrentChatButton('Buscar', 'search')]),
    });
  }
}

/**
 * Inline query global handler
 */
export async function handleInlineQuery(ctx: CustomContext): Promise<void> {
  logger.info('handle inline query', {
    module: 'telegram/handlers',
    from: ctx.from.id,
    query: ctx.inlineQuery.query,
  });
  if (ctx.inlineQuery.query.length < 3) {
    const results: Array<InlineQueryResult> = [
      {
        type: 'article',
        title: 'Escribe 3 caracteres para empezar a buscar',
        id: 'random',
        input_message_content: {
          message_text: 'eres tonto',
          parse_mode: 'HTML',
        },
      },
    ];
    ctx.answerInlineQuery(results);
  } else {
    handleSearchQuery(ctx);
  }
}

/**
 * Inline query search handler
 */
async function handleSearchQuery(ctx: CustomContext): Promise<void> {
  let games = await GameModel.findByName(ctx.inlineQuery.query);
  if (games.length == 0) {
    const chnl = new Channel<IGameDocument[]>();
    searchGame(ctx.inlineQuery.query, chnl);
    games = await chnl.recv();
    chnl.close();
  }
  const results: InlineQueryResultArticle[] = [];
  for (const game of games) {
    results.push({
      type: 'article',
      title: game.title,
      id: game.id,
      thumb_url: game.image,
      thumb_height: 524,
      thumb_width: 933,
      input_message_content: {
        message_text: game.getGameCard(),
        parse_mode: 'HTML',
      },
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.callbackButton('🔔 Subscribe', `sub:${game.id}`),
          Markup.callbackButton('🔕 Unsuscribe', `unsub:${game.id}`),
        ],
        [Markup.callbackButton('♻️ Update', `update:${game.id}`)],
      ]),
    });
  }
  ctx.answerInlineQuery(results.slice(0, 50), { cache_time: 24 * 60 * 60 });
}

/**
 * InlineKeyboard Callbkack handler
 */
export async function handleCallbackQuery(ctx: CustomContext): Promise<void | boolean> {
  logger.info('handle callback query', {
    from: ctx.callbackQuery.from.id,
    data: ctx.callbackQuery.data,
  });

  const [method, payload] = ctx.callbackQuery.data.split(':');
  switch (method) {
    case 'update': {
      let game = await GameModel.findById(payload).exec();
      if (!game) {
        ctx.answerCbQuery('something went worng', false);
        logger.error('tried to update inexistent game', { user: ctx.callbackQuery.from.id, game: payload });
      }
      const lastUpdated = Date.now() - game.lastUpdated.getTime();
      if (lastUpdated > 1000 * 60 * 60 * 24) {
        const chnl = new Channel<IGameDocument>();
        getGame(game.slug, chnl);
        game = await chnl.recv();
        chnl.close();
        ctx.editMessageText(game.getGameCard(), {
          parse_mode: 'HTML',
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.callbackButton('🔔 Subscribe', `sub:${game.id}`),
              Markup.callbackButton('🔕 Unsuscribe', `unsub:${game.id}`),
            ],
            [Markup.callbackButton('♻️ Update', `update:${game.id}`)],
          ]),
        });
        ctx.answerCbQuery();
      } else {
        ctx.answerCbQuery('Already updated!', false, { cache_time: (1000 * 60 * 60 * 24 - lastUpdated) / 1000 });
      }
      break;
    }
    case 'sub': {
      if (!ctx.state.user.dateOfRegistry) {
        return ctx.answerCbQuery('', false, {
          url: `t.me/${ctx.botInfo.username}?start=sub_${payload}`,
        });
      }
      if (await handleSub(ctx, payload)) {
        return ctx.answerCbQuery('Subscribed!', true);
      }
      ctx.answerCbQuery('Already subscribed!', false);
      break;
    }
    case 'unsub': {
      if (!ctx.state.user.dateOfRegistry) {
        return ctx.answerCbQuery('', false, {
          url: `t.me/${ctx.botInfo.username}?start=unsub_${payload}`,
        });
      }
      if (await handleUnsub(ctx, payload)) {
        return ctx.answerCbQuery('Unsubscribed!', true);
      }
      ctx.answerCbQuery('You are not subscribed!', false);
      break;
    }
    default:
      break;
  }
}

/**
 * Aux function to subscribe an User to a game
 */
async function handleSub(ctx: CustomContext, gameId: string): Promise<boolean> {
  const user = await ctx.state.user.populate('subscriptions').execPopulate();
  if (user.subscriptions.find((g) => g.id == gameId)) {
    return false;
  }
  ctx.state.user.subscriptions.push(await GameModel.findById(gameId).exec());
  ctx.state.user.save();
  return true;
}

/**
 * Aux function to unsubscribe an User to a game
 */
async function handleUnsub(ctx: CustomContext, gameId: string): Promise<boolean> {
  const user = await ctx.state.user.populate('subscriptions').execPopulate();
  const index = user.subscriptions.findIndex((g) => g.id == gameId);
  if (~index) {
    ctx.state.user.subscriptions.splice(index, 1);
    ctx.state.user.save();
    return true;
  }
  return false;
}
