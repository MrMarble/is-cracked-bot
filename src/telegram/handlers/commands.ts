import { getGameKeyboard, getSubList, handleSub } from '../../utils/utils';

import { BotCommand } from 'telegraf/typings/telegram-types';
import { Channel } from '../../utils/channel';
import { CustomContext } from './../telegram';
import { GameModel } from '../../database/games/games.model';
import { IGameDocument } from '../../database/games/games.types';
import { Markup } from 'telegraf';
import { logger } from '../../main';
import { searchGame } from '../../crackwatch/methods';

interface Command {
  handler(ctx: CustomContext): void;
  command: BotCommand;
}

export const Commands: Array<Command> = [
  {
    handler: handleStart,
    command: {
      command: 'start',
      description: 'Displays info about the bot.',
    },
  },
  {
    handler: handleSearchGame,
    command: {
      command: 'search',
      description: '<game name> Displays results for a name search.',
    },
  },
  {
    handler: handleSubs,
    command: {
      command: 'subscriptions',
      description: 'Shows your current subscriptions.',
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
      `<code>\t@${ctx.me} death stranding</code>`,
      `<code>\t@${ctx.me} cyberpunk</code>`,
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

async function handleSubs(ctx: CustomContext): Promise<void> {
  logger.info('handle subs command', {
    module: 'telegram/handlers',
    from: ctx.from.id,
    text: ctx.message.text,
  });

  if (ctx.state.user.subscriptions.length == 0) {
    ctx.reply('Subscribe to a game first!');
    return;
  }

  const games = (await ctx.state.user.populate('subscriptions').execPopulate()).subscriptions;
  ctx.reply('You are subscribed to:', { reply_markup: await getSubList(games) });
}
