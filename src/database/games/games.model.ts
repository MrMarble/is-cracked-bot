import { IGameDocument, IGameModel } from './games.types';

import GameSchema from './games.schema';
import { model } from 'mongoose';

export const GameModel = model<IGameDocument>('game', GameSchema) as IGameModel;
