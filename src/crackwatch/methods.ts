import * as WebSocket from 'ws';

import { idGen, ws } from './websocket';
import { parseResponse, responseToString } from './utils';

import { Channel } from '../utils/channel';
import { GameModel } from './../database/games/games.model';
import { IGameDocument } from '../database/games/games.types';
import { SocketResponse } from './types';
import { logger } from '../main';

export function getGame(slug: string, chnl: Channel<IGameDocument>): void {
  const id: string = idGen.next().value;
  const msg: SocketResponse = {
    msg: 'method',
    method: 'game.getAll',
    params: [slug],
    id,
  };

  logger.info('fetching game info', { module: 'websocket', msg });

  const handleGame = (data: WebSocket.Data) => {
    const msg: SocketResponse = parseResponse(data);
    if (msg.msg == 'result' && msg.id == id) {
      GameModel.findOneAndUpdate(
        { slug },
        {
          name: msg.result.game.title,
          isAAA: msg.result.game.isAAA,
          slug: msg.result.game.slug,
          protection: msg.result.game.protections,
          image: msg.result.game.image,
          releaseDate: msg.result.game.releaseDate,
          sceneGroups: msg.result.game.groups,
          crackDate: msg.result.game.crackDate,
          links: msg.result.game.links,
          prices: msg.result.game.prices,
          platforms: msg.result.game.platforms,
        },
        {
          upsert: true,
          setDefaultsOnInsert: true,
          useFindAndModify: false,
          new: true,
        },
        (err, doc) => {
          if (err) {
            logger.error('error creating game', { err: err.message });
            return;
          }
          chnl.send(doc);
        },
      );
      ws.off('message', handleGame);
    }
  };

  ws.on('message', handleGame);
  ws.send(responseToString(msg), (err) => {
    if (err) {
      logger.error('error fetching game', {
        module: 'websockets',
        error: err.message,
      });
    }
  });
}
