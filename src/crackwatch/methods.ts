import { Socket, SocketResponse } from './types';
import { parseResponse, responseToString } from '../utils/utils';

import { Channel } from '../utils/channel';
import { GameModel } from './../database/games/games.model';
import { IGameDocument } from '../database/games/games.types';
import { WSocket } from './websocket';
import WebSocket from 'ws';
import { logger } from '../main';

export async function getGame(slug: string, chnl: Channel<IGameDocument>): Promise<void> {
  const socket = await new WSocket().socket;
  const id: string = socket.idGen.next().value;
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
      socket.ws.off('message', handleGame);
    }
  };

  socket.ws.on('message', handleGame);
  socket.ws.send(responseToString(msg), (err) => {
    if (err) {
      logger.error('error fetching game', {
        module: 'websockets',
        error: err.message,
      });
    }
  });
}

export async function getGames(socket: Socket, slugs: Array<string>, chnl: Channel<IGameDocument>): Promise<void> {
  let msgs = slugs.map((slug) => {
    return {
      msg: 'method',
      method: 'game.getAll',
      params: [slug],
      id: socket.idGen.next().value,
    };
  });

  const handleGame = (data: WebSocket.Data) => {
    const msg: SocketResponse = parseResponse(data);
    const sent = msgs.find((m) => m.id == msg.id);
    if (msg.msg == 'result' && sent != undefined) {
      msgs = msgs.filter((msg) => msg.id != sent.id);

      delete msg.result.game._id;
      GameModel.findOneAndUpdate({ slug: sent.params[0] }, msg.result.game, {
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
            if (msgs.length == 0) {
              logger.info('all games updated, closing websocket', { module: 'websocket' });
              chnl.close();
              socket.ws.close();
            }
          });
        })
        .catch((reason: Error) => {
          logger.error('error creating game', { err: reason.message });
          chnl.close();
        });
    }
  };

  socket.ws.on('message', handleGame);
  msgs.forEach((msg) => {
    logger.info('fetching game info', { module: 'websocket', msg });
    socket.ws.send(responseToString(msg), (err) => {
      if (err) {
        logger.error('error fetching game', {
          module: 'websockets',
          error: err.message,
        });
      }
    });
  });
}

export async function searchGame(param: string, chnl: Channel<IGameDocument[]>): Promise<void> {
  const socket = await new WSocket().socket;
  const id: string = socket.idGen.next().value;
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
      socket.ws.off('message', handleSearch);
    }
  };

  socket.ws.on('message', handleSearch);
  socket.ws.send(responseToString(msg), (err) => {
    if (err) {
      logger.error('error searching games', {
        module: 'websockets',
        error: err.message,
      });
    }
  });
}
