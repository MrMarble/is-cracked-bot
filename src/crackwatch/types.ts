import { Channel } from '../utils/channel';
import { IGameDocument } from './../database/games/games.types';
import WebSocket from 'ws';

export interface Socket {
  ws: WebSocket;
  idGen: Generator<string, never, never>;
  lastMessage: number;
}

export interface SocketResponse {
  msg?: string;
  server_id?: string;
  method?: string;
  params?: Array<string | { [key: string]: string | boolean | number }>;
  version?: string;
  support?: Array<string>;
  id?: string;
  result?: GameResult;
}

export interface GameResult {
  game?: IGameDocument;
  games?: Array<IGameDocument>;
}

export interface socketThis {
  ws: WebSocket;
  id: string;
  chnl?: Channel<unknown>;
}
