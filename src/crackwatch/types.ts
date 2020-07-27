import * as WebSocket from 'ws';

import { Channel } from '../utils/channel';

export interface SocketResponse {
  msg?: string;
  server_id?: string;
  method?: string;
  params?: Array<string>;
  version?: string;
  support?: Array<string>;
  id?: string;
  result?: GameResult;
}

export interface GameResult {
  game: {
    _id: string;
    isAAA: boolean;
    title: string;
    image: string;
    releaseDate: Date;
    slug: string;
    protections: Array<string>;
  };
}

export interface socketThis {
  ws: WebSocket;
  id: string;
  chnl?: Channel<unknown>;
}
