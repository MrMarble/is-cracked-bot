import * as WebSocket from 'ws';

import { parseResponse, responseToString } from './utils';

import { Channel } from './../utils/channel';
import { GameModel } from './../database/games/games.model';
import { TelegrafContext } from 'telegraf/typings/context';
import { logger } from '../main';

export interface Response {
  msg: string;
  method?: string;
  params?: Array<string>;
  version?: string;
  support?: Array<string>;
  id?: string;
  result?: GameResult;
}
interface GameResult {
  game: {
    _id: string;
    isAAA: boolean;
    title: string;
    image: string;
    releaseDate: Date;
    slug: string;
    protections: Array<string>;
  };
}

interface socketThis {
  ws: WebSocket;
  id: string;
  ctx?: TelegrafContext;
  chnl?: Channel<unknown>;
}

export function handleConnect(this: WebSocket): void {
  logger.info('websocket connected', { module: 'crackwatch', url: this.url });
  const msg: Response = {
    msg: 'connect',
    version: '1',
    support: ['1', 'pre2', 'pre1'],
  };

  this.send(responseToString(msg), (err) => {
    if (err) {
      logger.error('error loggin websocket', {
        module: 'websockets',
        error: err.message,
      });
    }
  });
  logger.info('websocket logged');
}

export const handleErr = (err: Error): void => {
  logger.error('error connecting websocket', {
    module: 'crackwatch',
    error: err.message,
  });
};

export function handleGame(this: socketThis, data: string): void {
  const msg: Response = parseResponse(data);
  if (msg.msg == 'result' && msg.id == this.id) {
    GameModel.create({
      name: msg.result.game.title,
      isAAA: msg.result.game.isAAA,
      slug: msg.result.game.slug,
      drm: msg.result.game.protections,
      image: msg.result.game.image,
      releaseDate: msg.result.game.releaseDate,
    })
      .then((g) => this.chnl.send(g))
      .catch((err: Error) =>
        logger.error('error creating game', { err: err.message }),
      );
    this.ws.off('message', handleGame);
  }
}

export function handlePing(this: WebSocket): void {
  const response: Response = { msg: 'pong' };
  logger.info('pong', {
    module: 'handlers',
    response: responseToString(response),
  });
  this.send(responseToString(response), () => {
    setTimeout(() => this.send(responseToString({ msg: 'ping' })), 30 * 1000);
    this.send(responseToString({ msg: 'ping' }));
  });
}
