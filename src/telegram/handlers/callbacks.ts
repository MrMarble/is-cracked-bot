import { InlineQueryResult, InlineQueryResultArticle } from 'telegraf/typings/telegram-types';
import { getGame, searchGame } from '../../crackwatch/methods';
import { getGameKeyboard, handleSub, handleUnsub } from '../../utils/utils';

import { Channel } from '../../utils/channel';
import { CustomContext } from '../telegram';
import { GameModel } from '../../database/games/games.model';
import { IGameDocument } from '../../database/games/games.types';
import { logger } from '../../main';

export const QueryCallbacks: Record<string, (ctx: CustomContext, payload: string) => Promise<void | boolean>> = {
  update: handleUpdateCallback,
  sub: handleSubCallback,
  unsub: handleUnsubCallback,
};

async function handleUpdateCallback(ctx: CustomContext, gameId: string): Promise<void> {
  let game = await GameModel.findById(gameId).exec();
  if (!game) {
    ctx.answerCbQuery('something went worng', false);
    logger.error('tried to update inexistent game', { user: ctx.callbackQuery.from.id, game: gameId });
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
}

async function handleSubCallback(ctx: CustomContext, gameId: string): Promise<boolean> {
  if (!ctx.state.user.dateOfRegistry) {
    return ctx.answerCbQuery('', false, {
      url: `t.me/${ctx.botInfo.username}?start=sub_${gameId}`,
    });
  }

  if (await handleSub(ctx, gameId)) {
    return ctx.answerCbQuery('Subscribed!', true);
  }

  return ctx.answerCbQuery('Already subscribed!', false);
}

async function handleUnsubCallback(ctx: CustomContext, gameId: string): Promise<boolean> {
  if (!ctx.state.user.dateOfRegistry) {
    return ctx.answerCbQuery('You are not using the bot!', false);
  }
  if (await handleUnsub(ctx, gameId)) {
    return ctx.answerCbQuery('Unsubscribed!', true);
  }
  return ctx.answerCbQuery('You are not subscribed!', false);
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
