import { Document, Model } from 'mongoose';

export interface IGame {
  name: string;
  releaseDate: Date;
  crackDate?: Date;
  drm: Array<string>;
  sceneGroup?: string;
  slug: string;
  image: string;
  isAAA: boolean;
  dateOfEntry?: Date;
  lastUpdated?: Date;
}

export interface IGameDocument extends IGame, Document {
  setLastUpdated: (this: IGameDocument) => Promise<void>;
  getGameCard: (this: IGameDocument) => string;
}
export interface IGameModel extends Model<IGameDocument> {
  findByName: (this: IGameModel, name: string) => Promise<IGameDocument[]>;
}
