import { idGen, ws } from './websocket';

import { Channel } from '../utils/channel';
import { IGameDocument } from '../database/games/games.types';
import { SocketResponse } from './types';
import { handleGame } from './handlers';
import { logger } from '../main';
import { responseToString } from './utils';

export function getGame(name: string, chnl: Channel<IGameDocument>): void {
  const id: string = idGen.next().value;
  const msg: SocketResponse = {
    msg: 'method',
    method: 'game.getAll',
    params: [name],
    id,
  };

  logger.info('fetching game info', { module: 'websocket', msg });

  ws.on('message', handleGame.bind({ ws, id, chnl }));
  ws.send(responseToString(msg), (err) => {
    if (err) {
      logger.error('error fetching game', {
        module: 'websockets',
        error: err.message,
      });
    }
  });
}
