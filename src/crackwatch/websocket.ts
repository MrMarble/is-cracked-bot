import * as WebSocket from 'ws';

import { getUri, idGenerator } from './utils';
import { handleErr, handleMessage, handleOpen } from './handlers';

import { logger } from './../main';

export let ws: WebSocket; // Global websocket client
export let idGen: Generator<string, never, never>; // Id Generator for websocket communication

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

  ws.onerror = handleErr;
  ws.onopen = handleOpen;
  ws.onmessage = handleMessage;
  ws.onclose = (event: WebSocket.CloseEvent) => {
    logger.info('websocket closed', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });
    reconnectWS();
  };
};

export const closeWS = (): void => {
  ws.close();
  ws = null;
};

/**
 * Waits 3 seconds and tries to connect
 */
function reconnectWS(): void {
  setTimeout(() => {
    ws = null;
    connectWS();
  }, 3 * 1000);
}
