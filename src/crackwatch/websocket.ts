import * as WebSocket from 'ws';

import {
  Response,
  handleConnect,
  handleErr,
  handleGame,
  handlePing,
} from './handlers';
import { getUri, idGenerator, responseToString } from './utils';

import { TelegrafContext } from 'telegraf/typings/context';
import { logger } from './../main';

export let ws: WebSocket;
export let idGen: Generator<string>;
export const connectWS = (): void => {
  if (ws) {
    return;
  }
  const uri = getUri();
  try {
    ws = new WebSocket(uri);
    idGen = idGenerator();
  } catch (error) {
    logger.error('error connecting websocket', {
      module: 'crackwatch',
      error: error.message,
      uri,
    });
    process.exit(1);
  }

  ws.on('error', handleErr);
  ws.once('message', handleConnect);
  ws.on('ping', handlePing);
  ws.on('close', (code, reason) => {
    logger.info('websocket closed', { code, reason });
  });
};

export const closeWS = (): void => {
  ws.close();
  ws = null;
};

export function getGame(ctx: TelegrafContext): void {
  const id: string = idGen.next().value;
  const msg: Response = {
    msg: 'method',
    method: 'game.getAll',
    params: ['death-stranding'],
    id,
  };
  logger.info('fetching game info', { module: 'websocket', msg });
  ws.on('message', handleGame.bind({ ws, id, ctx }));
  ws.send(responseToString(msg), (err) => {
    if (err) {
      logger.error('error fetching game', {
        module: 'websockets',
        error: err.message,
      });
    }
  });
}
