import { getUri, idGenerator } from '../utils/utils';
import { handleErr, handleMessage, handleOpen } from './handlers';

import WebSocket from 'ws';
import { logger } from './../main';

export let ws: WebSocket; // Global websocket client
export let idGen: Generator<string, never, never>; // Id Generator for websocket communication

export const connectWS = (global = true): WebSocket => {
  if (!global && ws) {
    return ws;
  }

  const uri = getUri();
  let _ws: WebSocket;
  try {
    _ws = new WebSocket(uri);
    idGen = idGenerator();
  } catch (error) {
    logger.error('error connecting websocket', {
      module: 'crackwatch',
      error: error.message,
      uri,
    });
    process.exit(1);
  }
  // Node detects my temporal handlers as a possible memory leak
  _ws.setMaxListeners(20);
  _ws.onerror = handleErr;
  _ws.onopen = handleOpen;
  _ws.onmessage = handleMessage;
  _ws.onclose = (event: WebSocket.CloseEvent) => {
    logger.info('websocket closed', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });
    reconnectWS();
  };

  if (global) ws = _ws;
  return _ws;
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
