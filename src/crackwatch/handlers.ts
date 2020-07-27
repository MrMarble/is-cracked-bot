import * as WebSocket from 'ws';

import { SocketResponse, socketThis } from './types';
import { parseResponse, responseToString } from './utils';

import { GameModel } from './../database/games/games.model';
import { logger } from '../main';

export function handleOpen(event: WebSocket.OpenEvent): void {
  logger.info('websocket open', {
    url: event.target.url,
  });
}
export function handleMessage(event: WebSocket.MessageEvent): void {
  const msg = parseResponse(event.data);

  if (msg.server_id) {
    logger.info('websocket connected', { msg });
    event.target.send(
      responseToString({
        msg: 'connect',
        version: '1',
        support: ['1', 'pre2', 'pre1'],
      }),
    );
    return;
  }
  switch (msg.msg) {
    case 'connected':
      logger.info('websocket authorized', { msg });
      break;
    case 'ping':
      logger.info('websocket ping', { msg });
      handlePing.bind(event.target)();
      break;
    case 'pong':
      logger.info('websocket pong', { msg });
      break;
    default:
      logger.info('websocket message', { data: event.data, type: event.type });
      break;
  }
}

export const handleErr = (event: WebSocket.ErrorEvent): void => {
  logger.error('websocket error', {
    error: event.message,
    type: event.type,
  });
};

export function handleGame(this: socketThis, data: string): void {
  const msg: SocketResponse = parseResponse(data);
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

function handlePing(this: WebSocket): void {
  this.send(
    responseToString({
      msg: 'pong',
    }),
  );
  setTimeout(() => {
    this.send(
      responseToString({
        msg: 'ping',
      }),
    );
  }, 25 * 1000);
}
