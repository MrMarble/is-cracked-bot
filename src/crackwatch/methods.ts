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
      delete msg.result.game._id;
      GameModel.findOneAndUpdate({ slug }, msg.result.game, {
        upsert: true,
        setDefaultsOnInsert: true,
        useFindAndModify: false,
        new: true,
      })
        .exec()
        .then((doc) => {
          doc.setLastUpdated().then(() => {
            doc.save();
            chnl.send(doc);
          });
        })
        .catch((reason: Error) => {
          logger.error('error creating game', { err: reason.message });
          chnl.close();
        });
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

export async function searchGame(
  param: string,
  chnl: Channel<IGameDocument[]>,
): Promise<void> {
  const id: string = idGen.next().value;
  const msg: SocketResponse = {
    msg: 'method',
    method: 'games.page',
    params: [
      {
        page: 0,
        orderType: 'releaseDate',
        orderDown: true,
        search: param,
        unset: 0,
        released: 0,
        cracked: 0,
        isAAA: 0,
      },
    ],
    id,
  };

  logger.info('searching games', { module: 'websocket', msg });

  const handleSearch = (data: WebSocket.Data) => {
    const msg: SocketResponse = parseResponse(data);
    if (msg.msg == 'result' && msg.id == id) {
      const promises: Array<Promise<IGameDocument>> = [];
      for (const game of msg.result.games) {
        delete game._id;
        promises.push(
          GameModel.findOneAndUpdate({ slug: game.slug }, game, {
            upsert: true,
            setDefaultsOnInsert: true,
            useFindAndModify: false,
            new: true,
          }).exec(),
        );
      }
      Promise.all(promises)
        .then((games) => chnl.send(games))
        .catch((reason: Error) => {
          logger.error('error saving games', { err: reason.message });
          chnl.close();
        });
      ws.off('message', handleSearch);
    }
  };

  ws.on('message', handleSearch);
  ws.send(responseToString(msg), (err) => {
    if (err) {
      logger.error('error searching games', {
        module: 'websockets',
        error: err.message,
      });
    }
  });
}
