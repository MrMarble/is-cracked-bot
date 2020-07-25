import GameSchema from './games.schema';
import { IGameDocument } from './games.types';
import { model } from 'mongoose';

export const GameModel = model<IGameDocument>('game', GameSchema);
