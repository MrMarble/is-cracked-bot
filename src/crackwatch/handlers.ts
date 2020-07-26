import * as WebSocket from 'ws';

import { parseResponse, responseToString } from './utils';

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
  _id: string;
  isAAA: boolean;
  title: string;
  image: string;
  releaseDate: Date;
}

interface socketThis {
  ws: WebSocket;
  id: string;
  ctx?: TelegrafContext;
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
  console.log('websocket logged', { response: responseToString(msg) });
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
    this.ctx
      .reply(`<code>${JSON.stringify(msg.result)}</code>`, {
        parse_mode: 'HTML',
      })
      .catch((reason) => console.log(reason));
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
