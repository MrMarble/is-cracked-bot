import * as WebSocket from 'ws';

import { CustomContext } from '../telegram/telegram';
import { GameModel } from '../database/games/games.model';
import { IGameDocument } from './../database/games/games.types';
import { InlineKeyboardButton } from 'telegraf/typings/markup';
import { InlineKeyboardMarkup } from 'telegraf/typings/telegram-types';
import { Markup } from 'telegraf';
import { SocketResponse } from '../crackwatch/types';

export function getUri(): string {
  return `wss://crackwatch.com/sockjs/${getRandomNumber()}/${getRandomString()}/websocket`;
}

export function getRandomNumber(): string {
  return (Math.random() * 999).toFixed(0).padStart(3, '0');
}

export function getRandomString(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
  const length = 8;
  const result: Array<string> = [];

  for (let i = 0; i < length; i++) result.push(chars.substr(Math.floor(Math.random() * chars.length), 1));
  return result.join('');
}

export function* idGenerator(): Generator<string, never, never> {
  let id = 1;
  while (true) {
    yield (id++).toString();
  }
}

export function responseToString(response: SocketResponse): string {
  return `["${JSON.stringify(response).replace(/"/g, '\\"')}"]`;
}

export function parseResponse(response: string | WebSocket.Data): SocketResponse {
  if (typeof response == 'string') {
    const pattern = /a?\["(.+)"\]/g;
    const matches = pattern.exec(response);
    if (matches?.length > 0) {
      return JSON.parse(matches[1].replace(/\\"/g, '"'));
    }
  }
  return { msg: '' };
}

export function getGameKeyboard(gameId: number): InlineKeyboardMarkup {
  return Markup.inlineKeyboard([
    [Markup.callbackButton('🔔 Subscribe', `sub:${gameId}`), Markup.callbackButton('🔕 Unsuscribe', `unsub:${gameId}`)],
    [Markup.callbackButton('♻️ Update', `update:${gameId}`)],
  ]);
}

/**
 * Aux function to subscribe an User to a game
 */
export async function handleSub(ctx: CustomContext, gameId: string): Promise<IGameDocument> {
  const user = await ctx.state.user.populate('subscriptions').execPopulate();
  if (user.subscriptions.find((g) => g?.id == gameId)) {
    return null;
  }
  const game = await GameModel.findById(gameId).exec();
  ctx.state.user.subscriptions.push(game);
  ctx.state.user.save();
  return game;
}

/**
 * Aux function to unsubscribe an User to a game
 */
export async function handleUnsub(ctx: CustomContext, gameId: string): Promise<boolean> {
  const user = await ctx.state.user.populate('subscriptions').execPopulate();
  const index = user.subscriptions.findIndex((g) => g?.id == gameId);
  if (~index) {
    ctx.state.user.subscriptions.splice(index, 1);
    ctx.state.user.save();
    return true;
  }
  return false;
}

export async function getSubList(games: IGameDocument[], current?: string | number): Promise<InlineKeyboardMarkup> {
  const itemsPerPage = 5;
  const gameButtons = games.map((game) => [Markup.callbackButton(game.title, `info:${game.id}`)]);
  const navigation: Array<InlineKeyboardButton> = [];
  const buttons = [];
  current = Number.parseInt(current?.toString()) || 0;

  if (current != 0) {
    navigation.push(Markup.callbackButton('⬅️ Prev', `list:${current - 1}`));
  }

  if (gameButtons.length > itemsPerPage + current * itemsPerPage) {
    navigation.push(Markup.callbackButton('Next ➡️', `list:${current + 1}`));
  }

  buttons.push(...gameButtons.slice(current * itemsPerPage, itemsPerPage + current * itemsPerPage));
  return Markup.inlineKeyboard([...buttons, navigation]);
}

export function getInfoKeyboard(gameId: string): InlineKeyboardMarkup {
  return Markup.inlineKeyboard([
    [Markup.callbackButton('🔕 Unsuscribe', `unsub:${gameId}`), Markup.callbackButton('♻️ Update', `update:${gameId}`)],
    [Markup.callbackButton('↩️ Back to list', `list:0`)],
  ]);
}
