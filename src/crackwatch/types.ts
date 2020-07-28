import * as WebSocket from 'ws';

import { Channel } from '../utils/channel';
import { IGameDocument } from './../database/games/games.types';

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
