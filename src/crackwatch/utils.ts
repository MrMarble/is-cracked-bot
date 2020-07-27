import * as WebSocket from 'ws';

import { SocketResponse } from './types';

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

  for (let i = 0; i < length; i++)
    result.push(chars.substr(Math.floor(Math.random() * chars.length), 1));
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

export function parseResponse(
  response: string | WebSocket.Data,
): SocketResponse {
  if (typeof response == 'string') {
    const pattern = /a?\["(.+)"\]/g;
    const matches = pattern.exec(response);
    if (matches?.length > 0) {
      return JSON.parse(matches[1].replace(/\\"/g, '"'));
    }
  }
  return { msg: '' };
}
