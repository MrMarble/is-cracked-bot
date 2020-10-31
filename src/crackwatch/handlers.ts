import { parseResponse, responseToString } from '../utils/utils';

import { Socket } from './types';
import WebSocket from 'ws';
import { logger } from '../main';

export function handleOpen(event: WebSocket.OpenEvent): void {
  logger.info('websocket open', {
    url: event.target.url,
  });
}
export function handleMessage(this: Socket, event: WebSocket.MessageEvent): void {
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
      this.ws.emit('authorized');
      break;
    case 'ping':
      logger.debug('websocket ping', { msg });
      handlePing.bind(this)();
      break;
    case 'pong':
      logger.debug('websocket pong', { msg });
      break;
    default:
      this.lastMessage = Date.now();
      logger.debug('websocket message', { data: event.data, type: event.type });
      break;
  }
}

export function handleErr(this: Socket, event: WebSocket.ErrorEvent): void {
  logger.error('websocket error', {
    error: event.message,
    type: event.type,
  });
}

function handlePing(this: Socket): void {
  this.ws.send(
    responseToString({
      msg: 'pong',
    }),
  );
  setTimeout(() => {
    this.ws.send(
      responseToString({
        msg: 'ping',
      }),
    );
  }, 25 * 1000);
}
