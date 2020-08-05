import { getGameKeyboard, getSubList, handleSub } from '../../utils/utils';

import { BotCommand } from 'telegraf/typings/telegram-types';
import { Channel } from '../../utils/channel';
import { CustomContext } from './../telegram';
import { GameModel } from '../../database/games/games.model';
import { IGameDocument } from '../../database/games/games.types';
import { Markup } from 'telegraf';
import { UserModel } from './../../database/users/users.model';
import { logger } from '../../main';
import { searchGame } from '../../crackwatch/methods';

interface Command {
  handler(ctx: CustomContext): void;
  command: BotCommand;
  private?: boolean;
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
  {
    handler: handleStats,
    command: {
      command: 'stats',
      description: 'Shows stats of the bot',
    },
    private: true,
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

  ctx.reply(ctx.i18n.t('welcome', { me: ctx.me }), { parse_mode: 'HTML', disable_web_page_preview: true });

  if (ctx.startPayload) {
    const [method, payload] = ctx.startPayload.split('_');
    switch (method) {
      case 'sub': {
        const game = await handleSub(ctx, payload);
        ctx.reply(ctx.i18n.t('subscribed_to', { title: game.title }));
        break;
      }
      case 'unsub':
        handleSub(ctx, payload);
        ctx.reply(ctx.i18n.t('unsubscribed'));
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
      ctx.reply(ctx.i18n.t('search_multiple_results', { query }), {
        reply_markup: Markup.inlineKeyboard([
          Markup.switchToCurrentChatButton(ctx.i18n.t('search_multiple_results_button', { query }), query),
        ]),
        parse_mode: 'HTML',
      });
    } else if (games.length == 1) {
      ctx.reply(games[0].getGameCard(), {
        reply_markup: games[0].isCracked() ? undefined : getGameKeyboard(ctx, games[0].id),
        parse_mode: 'HTML',
      });
    } else {
      ctx.reply(ctx.i18n.t('no_results', { query }));
    }
  } else {
    ctx.reply(ctx.i18n.t('search_command', { me: ctx.me }), {
      reply_markup: Markup.inlineKeyboard([Markup.switchToCurrentChatButton('Search', 'minecraft')]),
      parse_mode: 'HTML',
    });
  }
}

async function handleSubs(ctx: CustomContext): Promise<void> {
  logger.info('handle subs command', {
    module: 'telegram/handlers',
    from: ctx.from.id,
    text: ctx.message.text,
  });

  if (ctx.state.user.subscriptions.length == 0) {
    ctx.reply(ctx.i18n.t('subscribe_first'));
    return;
  }

  const games = (await ctx.state.user.populate('subscriptions').execPopulate()).subscriptions;
  ctx.reply(ctx.i18n.t('subs_command'), { reply_markup: await getSubList(ctx, games) });
}

async function handleStats(ctx: CustomContext): Promise<void> {
  if (!process.env?.CRACK_WATCH_ADMINS?.split(',').includes(ctx.from.id.toString())) return;

  const users = await UserModel.find().populate('subscriptions').exec();
  const games = await GameModel.find().exec();

  ctx.reply(
    [
      `<b>users:</b>\t${users.length}`,
      `<b>registered:</b>\t${users.filter((u) => u.dateOfRegistry).length}`,
      `<b>games:</b>\t${games.length}`,
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
}
