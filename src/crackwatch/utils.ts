import { Response } from './handlers';

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

export function* idGenerator(): Generator<string> {
  let id = 1;
  while (true) {
    yield (id++).toString();
  }
}

export function responseToString(response: Response): string {
  return `["${JSON.stringify(response).replace(/"/g, '\\"')}"]`;
}

export function parseResponse(response: string): Response {
  const pattern = /a?\["(.+)"\]/g;
  const matches = pattern.exec(response);
  return JSON.parse(matches[1].replace(/\\"/g, '"'));
}
