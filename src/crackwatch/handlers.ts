import * as WebSocket from 'ws';

import { parseResponse, responseToString } from './utils';

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
      logger.debug('websocket ping', { msg });
      handlePing.bind(event.target)();
      break;
    case 'pong':
      logger.debug('websocket pong', { msg });
      break;
    default:
      logger.debug('websocket message', { data: event.data, type: event.type });
      break;
  }
}

export const handleErr = (event: WebSocket.ErrorEvent): void => {
  logger.error('websocket error', {
    error: event.message,
    type: event.type,
  });
};

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
