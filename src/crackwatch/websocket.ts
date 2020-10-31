import { getUri, idGenerator } from '../utils/utils';
import { handleErr, handleMessage, handleOpen } from './handlers';

import { Socket } from './types';
import WebSocket from 'ws';
import { logger } from './../main';
import { waitFor } from 'wait-for-event';

export async function newSocket(): Promise<Socket> {
  logger.info('Creating new instance of WebSocket');
  const socket: Socket = {
    ws: null,
    idGen: idGenerator(),
    lastMessage: Date.now(),
  };

  const uri = getUri();

  try {
    socket.ws = new WebSocket(uri);
  } catch (error) {
    logger.error('error connecting websocket', {
      module: 'crackwatch',
      error: error.message,
      uri,
    });
    process.exit(1);
  }

  socket.ws.onerror = handleErr.bind(socket);
  socket.ws.onopen = handleOpen.bind(socket);
  socket.ws.onmessage = handleMessage.bind(socket);

  socket.ws.onclose = (event: WebSocket.CloseEvent) => {
    logger.info('websocket closed', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });
  };

  const interval = setInterval(() => {
    if (Date.now() - socket.lastMessage > 30 * 1000) {
      //Last query is older than 10 minutes
      logger.info('Closing websocket', {
        reason: 'idle',
      });
      socket.ws.close();
      delete WSocket.instance;
      clearInterval(interval);
    }
  }, 30 * 1000);

  await waitFor('authorized', socket.ws);
  return socket;
}

export class WSocket {
  public static instance: WSocket;
  public socket: Promise<Socket>;

  constructor() {
    if (WSocket.instance) {
      return WSocket.instance;
    }
    WSocket.instance = this;
    this.socket = newSocket();
  }

  static closeWS(): void {
    if (WSocket.instance) {
      (async () => {
        (await WSocket.instance.socket).ws.close();
      })();
    }
  }
}

export function closeWS(): void {
  WSocket.closeWS();
}
