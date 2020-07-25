import { Document, Model } from 'mongoose';

export interface IGame {
  name: string;
  releaseDate: Date;
  crackDate: Date;
  drm: string;
  sceneGroup: string;
  dateOfEntry?: Date;
  lastUpdated?: Date;
}

export interface IGameDocument extends IGame, Document {
  setLastUpdated: (this: IGameDocument) => Promise<void>;
}
export interface IGameModel extends Model<IGameDocument> {
  findByName: (this: IGameModel, name: string) => Promise<IGameDocument[]>;
}
