import { BotCommand, InlineQueryResult, InlineQueryResultArticle } from 'telegraf/typings/telegram-types';
import { getGame, searchGame } from '../crackwatch/methods';
import { getGameKeyboard, handleSub, handleUnsub } from '../utils/utils';

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

  ctx.reply(
    [
      'Telegram bot for <a href="https://crackwatch.com">crackwatch.com</a>',
      'This bot will notify you when a game is cracked.',
      "\nIt <b>DOESN'T</b> provides any link to download them, only tracks the status",
      '\nUsage:',
      `<code>\t${ctx.me} death stranding</code>`,
      `<code>\t${ctx.me} cyberpunk<code/>`,
    ].join('\n'),
    { parse_mode: 'HTML', disable_web_page_preview: true },
  );

  if (ctx.startPayload) {
    const [method, payload] = ctx.startPayload.split('_');
    switch (method) {
      case 'sub': {
        const game = await handleSub(ctx, payload);
        ctx.reply(`Subscribed to ${game.title}!`);
        break;
      }
      case 'unsub':
        handleSub(ctx, payload);
        ctx.reply('Unsubscribed!');
        break;
      default:
        break;
    }
  }
}

async function handleSearchGame(ctx: CustomContext): Promise<void> {
  logger.info('handle search command', {
    module: 'telegram/handlers',
    from: ctx.from.id,
    text: ctx.message.text,
  });
  const query = ctx.message.text.substr('/search'.length).trim();
  if (query) {
    let games = await GameModel.findByName(query);
    if (games.length == 0) {
      const chnl: Channel<IGameDocument[]> = new Channel();
      searchGame(query, chnl);
      games = await chnl.recv();
    }
    if (games.length > 1) {
      ctx.reply(
        [
          `Seems like there are multiple results for <code>${query}</code>`,
          'Use this button to search through them',
        ].join('\n'),
        {
          reply_markup: Markup.inlineKeyboard([Markup.switchToCurrentChatButton(`Results for ${query}`, query)]),
          parse_mode: 'HTML',
        },
      );
    } else if (games.length == 1) {
      ctx.reply(games[0].getGameCard(), {
        reply_markup: games[0].isCracked() ? undefined : getGameKeyboard(games[0].id),
        parse_mode: 'HTML',
      });
    } else {
      ctx.reply(`Could not find anything for ${query}`);
    }
  } else {
    ctx.reply(
      [
        `To search in a more dynamic way use the inline method.`,
        `That way you can see the games as you type the name`,
        `Examples:`,
        `<code>\t@${ctx.me} minecraft</code>`,
        `<code>\t@${ctx.me} Death str</code> &lt;- don't need to type the full name`,
        `Click the button below to get it going`,
      ].join('\n'),
      {
        reply_markup: Markup.inlineKeyboard([Markup.switchToCurrentChatButton('Search', 'minecraft')]),
        parse_mode: 'HTML',
      },
    );
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
        title: 'IsCrackedBot',
        description: 'Track crack status of a game',
        id: 'info',
        input_message_content: {
          message_text: [
            'Telegram bot for <a href="https://crackwatch.com">crackwatch.com</a>',
            'This bot will notify you when a game is cracked.',
            "\nIt <b>DOESN'T</b> provides any link to download them, only tracks the status",
          ].join('\n'),
          parse_mode: 'HTML',
        },
      },
      {
        type: 'article',
        title: 'Type at least 3 characters to start searching',
        id: 'info1',
        input_message_content: {
          message_text: [
            'Telegram bot for <a href="https://crackwatch.com">crackwatch.com</a>',
            'This bot will notify you when a game is cracked.',
            "\nIt <b>DOESN'T</b> provides any link to download them, only tracks the status",
          ].join('\n'),
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
      description: game.isCracked() ? 'Cracked' : 'Not cracked',
      id: game.id,
      thumb_url: game.image,
      thumb_height: 524,
      thumb_width: 933,
      input_message_content: {
        message_text: game.getGameCard(),
        parse_mode: 'HTML',
      },
      reply_markup: game.isCracked() ? undefined : getGameKeyboard(game.id),
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
          reply_markup: game.isCracked() ? undefined : getGameKeyboard(game.id),
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
        return ctx.answerCbQuery('You are not using the bot!', false);
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
